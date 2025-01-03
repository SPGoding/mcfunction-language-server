import * as core from '@spyglassmc/core'
import { fileUtil } from '@spyglassmc/core'
import { NodeJsExternals } from '@spyglassmc/core/lib/nodejs.js'
import * as je from '@spyglassmc/java-edition'
import * as locales from '@spyglassmc/locales'
import * as mcdoc from '@spyglassmc/mcdoc'
import envPaths from 'env-paths'
import url from 'url'
import * as util from 'util'
import * as ls from 'vscode-languageserver/node.js'
import type {
	CustomInitializationOptions,
	CustomServerCapabilities,
	MyLspDataHackPubifyRequestParams,
} from './util/index.js'
import { toCore, toLS } from './util/index.js'
import { LspFsWatcher } from './util/LspFsWatcher.js'

export * from './util/types.js'

if (process.argv.length === 2) {
	// When the server is launched from the cmd script, the process arguments
	// are wiped. I don't know why it happens, but this is what it is.
	// Therefore, we push a '--stdio' if the argument list is too short.
	process.argv.push('--stdio')
}

const { cache: cacheRoot } = envPaths('spyglassmc')

const connection = ls.createConnection()
let capabilities!: ls.ClientCapabilities
let fsWatcher: LspFsWatcher | undefined
let workspaceFolders!: ls.WorkspaceFolder[]
let hasShutdown = false

const externals = NodeJsExternals
const logger: core.Logger = {
	error: (msg: any, ...args: any[]): void => connection.console.error(util.format(msg, ...args)),
	info: (msg: any, ...args: any[]): void => connection.console.info(util.format(msg, ...args)),
	log: (msg: any, ...args: any[]): void => connection.console.log(util.format(msg, ...args)),
	warn: (msg: any, ...args: any[]): void => connection.console.warn(util.format(msg, ...args)),
}
let service!: core.Service

connection.onInitialize(async (params) => {
	const initializationOptions = params.initializationOptions as
		| CustomInitializationOptions
		| undefined

	logger.info(`[onInitialize] processId = ${JSON.stringify(params.processId)}`)
	logger.info(`[onInitialize] clientInfo = ${JSON.stringify(params.clientInfo)}`)
	logger.info(`[onInitialize] initializationOptions = ${JSON.stringify(initializationOptions)}`)

	capabilities = params.capabilities
	workspaceFolders = params.workspaceFolders ?? []
	const projectRoots = workspaceFolders.map(f => core.fileUtil.ensureEndingSlash(f.uri))

	if (initializationOptions?.inDevelopmentMode) {
		await new Promise((resolve) => setTimeout(resolve, 3000))
		logger.warn(
			'Delayed 3 seconds manually. If you see this in production, it means SPGoding messed up.',
		)
	}

	try {
		await locales.loadLocale(params.locale)
	} catch (e) {
		logger.error('[loadLocale]', e)
	}

	if (capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration) {
		// Initializes LspFsWatcher when client supports didChangeWatchedFiles notifications.
		fsWatcher = new LspFsWatcher(projectRoots, logger)
			.on('ready', () => logger.info('[FsWatcher] ready'))
			.on('add', (uri) => logger.info('[FsWatcher] added', uri))
			.on('change', (uri) => logger.info('[FsWatcher] changed', uri))
			.on('unlink', (uri) => logger.info('[FsWatcher] unlinked', uri))
			.on('error', (e) => logger.error('[FsWatcher]', e))
	}

	try {
		service = new core.Service({
			isDebugging: initializationOptions?.inDevelopmentMode,
			logger,
			profilers: new core.ProfilerFactory(logger, [
				'cache#load',
				'cache#save',
				'project#init',
				'project#ready',
				'project#ready#bind',
			]),
			project: {
				defaultConfig: core.ConfigService.merge(core.VanillaConfig, {
					env: { gameVersion: initializationOptions?.gameVersion },
				}),
				cacheRoot: fileUtil.ensureEndingSlash(url.pathToFileURL(cacheRoot).toString()),
				externals,
				initializers: [mcdoc.initialize, je.initialize],
				projectRoots,
				projectRootsWatcher: fsWatcher,
			},
		})
		service.project.on('documentErrored', async ({ errors, uri, version }) => {
			try {
				await connection.sendDiagnostics({
					diagnostics: toLS.diagnostics(errors),
					uri,
					version,
				})
			} catch (e) {
				console.error('[sendDiagnostics]', e)
			}
		}).on('ready', async () => {
			await connection.sendProgress(ls.WorkDoneProgress.type, 'initialize', { kind: 'end' })
		})
		await service.project.init()
	} catch (e) {
		logger.error('[new Service]', e)
	}

	const customCapabilities: CustomServerCapabilities = {
		dataHackPubify: true,
		resetProjectCache: true,
		showCacheRoot: true,
	}

	const ans: ls.InitializeResult = {
		serverInfo: { name: 'Spyglass Language Server' },
		capabilities: {
			codeActionProvider: {},
			colorProvider: {},
			completionProvider: { triggerCharacters: service.project.meta.getTriggerCharacters() },
			declarationProvider: {},
			definitionProvider: {},
			implementationProvider: {},
			// TODO: re-enable this
			// documentFormattingProvider: {},
			referencesProvider: {},
			typeDefinitionProvider: {},
			documentHighlightProvider: {},
			documentSymbolProvider: { label: 'Spyglass' },
			hoverProvider: {},
			inlayHintProvider: {},
			semanticTokensProvider: {
				documentSelector: toLS.documentSelector(service.project.meta),
				legend: toLS.semanticTokensLegend(),
				full: { delta: false },
				range: true,
			},
			signatureHelpProvider: { triggerCharacters: [' '] },
			textDocumentSync: { change: ls.TextDocumentSyncKind.Incremental, openClose: true },
			workspaceSymbolProvider: {},
			experimental: { spyglassmc: customCapabilities },
		},
	}

	if (capabilities.workspace?.workspaceFolders) {
		ans.capabilities.workspace = {
			workspaceFolders: { supported: true, changeNotifications: true },
		}
	}

	return ans
})

connection.onInitialized(async () => {
	if (capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration) {
		const watcherDisposable = await connection.client.register(
			ls.DidChangeWatchedFilesNotification.type,
			{
				watchers: [{ globPattern: '**/*' }],
			},
		)
		fsWatcher!.setLspListener(watcherDisposable)
	}

	await service.project.ready()
	if (capabilities.workspace?.workspaceFolders) {
		connection.workspace.onDidChangeWorkspaceFolders(async () => {
			// FIXME
			// service.rawRoots = (await connection.workspace.getWorkspaceFolders() ?? []).map(r => r.uri)
		})
	}
})

connection.onDidOpenTextDocument(
	({ textDocument: { text, uri, version, languageId: languageID } }) => {
		return service.project.onDidOpen(uri, languageID, version, text)
	},
)
connection.onDidChangeTextDocument(({ contentChanges, textDocument: { uri, version } }) => {
	return service.project.onDidChange(uri, contentChanges, version)
})
connection.onDidCloseTextDocument(({ textDocument: { uri } }) => {
	service.project.onDidClose(uri)
})

connection.onDidChangeWatchedFiles((params) => {
	logger.info('[FsWatcher] raw LSP changes', params)
	void fsWatcher!.onLspDidChangeWatchedFiles(params)
})

connection.onCodeAction(async ({ textDocument: { uri }, range }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const codeActions = service.getCodeActions(node, doc, toCore.range(range, doc))
	return codeActions.map(a => toLS.codeAction(a, doc))
})

connection.onColorPresentation(async ({ textDocument: { uri }, color, range }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const presentation = service.getColorPresentation(
		node,
		doc,
		toCore.range(range, doc),
		toCore.color(color),
	)
	return toLS.colorPresentationArray(presentation, doc)
})
connection.onDocumentColor(async ({ textDocument: { uri } }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const info = service.getColorInfo(node, doc)
	return toLS.colorInformationArray(info, doc)
})

connection.onCompletion(async ({ textDocument: { uri }, position, context }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const offset = toCore.offset(position, doc)
	const items = service.complete(node, doc, offset, context?.triggerCharacter)
	return items.map((item) =>
		toLS.completionItem(
			item,
			doc,
			offset,
			capabilities.textDocument?.completion?.completionItem?.insertReplaceSupport,
		)
	)
})

connection.onRequest(
	'spyglassmc/dataHackPubify',
	({ initialism }: MyLspDataHackPubifyRequestParams) => {
		return service.dataHackPubify(initialism)
	},
)

connection.onDeclaration(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const ans = await service.getSymbolLocations(node, doc, toCore.offset(position, doc), [
		'declaration',
		'definition',
	])
	return toLS.locationLink(ans, doc, capabilities.textDocument?.declaration?.linkSupport)
})
connection.onDefinition(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const ans = await service.getSymbolLocations(node, doc, toCore.offset(position, doc), [
		'definition',
		'declaration',
		'implementation',
		'typeDefinition',
	])
	return toLS.locationLink(ans, doc, capabilities.textDocument?.definition?.linkSupport)
})
connection.onImplementation(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const ans = await service.getSymbolLocations(node, doc, toCore.offset(position, doc), [
		'implementation',
		'definition',
	])
	return toLS.locationLink(ans, doc, capabilities.textDocument?.implementation?.linkSupport)
})
connection.onReferences(
	async ({ textDocument: { uri }, position, context: { includeDeclaration } }) => {
		const docAndNode = await service.project.ensureClientManagedChecked(uri)
		if (!docAndNode) {
			return undefined
		}
		const { doc, node } = docAndNode
		const ans = await service.getSymbolLocations(
			node,
			doc,
			toCore.offset(position, doc),
			includeDeclaration ? undefined : ['reference'],
		)
		return toLS.locationLink(ans, doc, false)
	},
)
connection.onTypeDefinition(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const ans = await service.getSymbolLocations(node, doc, toCore.offset(position, doc), [
		'typeDefinition',
	])
	return toLS.locationLink(ans, doc, capabilities.textDocument?.typeDefinition?.linkSupport)
})

connection.onDocumentHighlight(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const ans = await service.getSymbolLocations(
		node,
		doc,
		toCore.offset(position, doc),
		undefined,
		true,
	)
	return toLS.documentHighlight(ans)
})

connection.onDocumentSymbol(async ({ textDocument: { uri } }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	return toLS.documentSymbolsFromTables(
		[service.project.symbols.global, ...core.AstNode.getLocalsToLeaves(node)],
		doc,
		capabilities.textDocument?.documentSymbol?.hierarchicalDocumentSymbolSupport,
		capabilities.textDocument?.documentSymbol?.symbolKind?.valueSet,
	)
})

connection.onHover(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const ans = service.getHover(node, doc, toCore.offset(position, doc))
	return ans ? toLS.hover(ans, doc) : undefined
})

connection.languages.inlayHint.on(async ({ textDocument: { uri }, range }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return []
	}
	const { doc, node } = docAndNode
	const hints = service.getInlayHints(node, doc, toCore.range(range, doc))
	return toLS.inlayHints(hints, doc)
})

connection.onRequest('spyglassmc/resetProjectCache', async (): Promise<void> => {
	return service.project.resetCache()
})

connection.onRequest('spyglassmc/showCacheRoot', async (): Promise<void> => {
	return service.project.showCacheRoot()
})

connection.languages.semanticTokens.on(async ({ textDocument: { uri } }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return { data: [] }
	}
	const { doc, node } = docAndNode
	const tokens = service.colorize(node, doc)
	return toLS.semanticTokens(
		tokens,
		doc,
		capabilities.textDocument?.semanticTokens?.multilineTokenSupport,
	)
})
connection.languages.semanticTokens.onRange(async ({ textDocument: { uri }, range }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return { data: [] }
	}
	const { doc, node } = docAndNode
	const tokens = service.colorize(node, doc, toCore.range(range, doc))
	return toLS.semanticTokens(
		tokens,
		doc,
		capabilities.textDocument?.semanticTokens?.multilineTokenSupport,
	)
})

connection.onSignatureHelp(async ({ textDocument: { uri }, position }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	const help = service.getSignatureHelp(node, doc, toCore.offset(position, doc))
	return toLS.signatureHelp(help)
})

connection.onWorkspaceSymbol(({ query }) => {
	return toLS.symbolInformationArrayFromTable(
		service.project.symbols.global,
		query,
		capabilities.textDocument?.documentSymbol?.symbolKind?.valueSet,
	)
})

connection.onDocumentFormatting(async ({ textDocument: { uri }, options }) => {
	const docAndNode = await service.project.ensureClientManagedChecked(uri)
	if (!docAndNode) {
		return undefined
	}
	const { doc, node } = docAndNode
	let text = service.format(node, doc, options.tabSize, options.insertSpaces)
	if (options.insertFinalNewline && text.charAt(text.length - 1) !== '\n') {
		text += '\n'
	}
	return [toLS.textEdit(node.range, text, doc)]
})

connection.onShutdown(async (): Promise<void> => {
	await service.project.close()
	hasShutdown = true
})
connection.onExit((): void => {
	connection.dispose()
	if (!hasShutdown) {
		console.error(
			'The server has not finished the shutdown request before receiving the exit request.',
		)
		process.exitCode = 1
	}
})

connection.listen()
