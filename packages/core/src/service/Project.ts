import * as micromatch from 'micromatch'
import type { TextDocumentContentChangeEvent } from 'vscode-languageserver-textdocument'
import { TextDocument } from 'vscode-languageserver-textdocument'
import type { ExternalEventEmitter, Externals, IntervalId } from '../common/index.js'
import {
	bufferToString,
	Logger,
	normalizeUri,
	SingletonPromise,
	StateProxy,
} from '../common/index.js'
import type { AstNode } from '../node/index.js'
import { FileNode } from '../node/index.js'
import { file } from '../parser/index.js'
import { traversePreOrder } from '../processor/index.js'
import type { PosRangeLanguageError } from '../source/index.js'
import { LanguageError, Range, Source } from '../source/index.js'
import { SymbolUtil } from '../symbol/index.js'
import { CacheService } from './CacheService.js'
import type { Config } from './Config.js'
import { ConfigService, LinterConfigValue } from './Config.js'
import {
	BinderContext,
	CheckerContext,
	LinterContext,
	ParserContext,
	UriBinderContext,
} from './Context.js'
import type { Dependency } from './Dependency.js'
import { DependencyKey } from './Dependency.js'
import { Downloader } from './Downloader.js'
import { LinterErrorReporter } from './ErrorReporter.js'
import { ArchiveUriSupporter, FileService, FileUriSupporter } from './FileService.js'
import type { RootUriString } from './fileUtil.js'
import { fileUtil } from './fileUtil.js'
import type { FsWatcher } from './FsWatcher.js'
import { MetaRegistry } from './MetaRegistry.js'
import { ProfilerFactory } from './Profiler.js'

const CacheAutoSaveInterval = 600_000 // 10 Minutes.

export type ProjectInitializerContext = Pick<
	Project,
	| 'cacheRoot'
	| 'config'
	| 'downloader'
	| 'externals'
	| 'isDebugging'
	| 'logger'
	| 'meta'
	| 'projectRoots'
>
export type SyncProjectInitializer = (
	this: void,
	ctx: ProjectInitializerContext,
) => Record<string, string> | void
export type AsyncProjectInitializer = (
	this: void,
	ctx: ProjectInitializerContext,
) => PromiseLike<Record<string, string> | void>
export type ProjectInitializer = SyncProjectInitializer | AsyncProjectInitializer

export interface ProjectOptions {
	cacheRoot: RootUriString
	defaultConfig?: Config
	downloader?: Downloader
	externals: Externals
	fs?: FileService
	initializers?: readonly ProjectInitializer[]
	isDebugging?: boolean
	logger?: Logger
	profilers?: ProfilerFactory
	/**
	 * File URIs to the roots of this project.
	 */
	projectRoots: RootUriString[]
	projectRootsWatcher?: FsWatcher
	symbols?: SymbolUtil
}

export interface DocAndNode {
	doc: TextDocument
	node: FileNode<AstNode>
}

interface DocumentEvent extends DocAndNode {}
interface DocumentErrorEvent {
	errors: readonly PosRangeLanguageError[]
	uri: string
	version?: number
}
interface FileEvent {
	uri: string
}
interface EmptyEvent {}
interface RootsEvent {
	roots: readonly RootUriString[]
}
interface SymbolRegistrarEvent {
	id: string
	checksum: string | undefined
}

export type ProjectData = Pick<
	Project,
	| 'cacheRoot'
	| 'config'
	| 'downloader'
	| 'ensureBindingStarted'
	| 'externals'
	| 'fs'
	| 'isDebugging'
	| 'logger'
	| 'meta'
	| 'profilers'
	| 'projectRoots'
	| 'roots'
	| 'symbols'
	| 'ctx'
>

/* istanbul ignore next */
/**
 * Manage all tracked documents and errors.
 *
 * The four stages of processing a document:
 * 1. `read` - read the file from the external file system as a `TextDocument`.
 * 2. `parse` - Parse the `TextDocument` into an `AstNode`.
 * 3. `bind` - Bind the `AstNode` and populate both the global symbol table and the local symbol tables on the nodes.
 * 4. `check` (includes `lint`) - Check the `AstNode` with information from the symbol tables.
 *
 * **Caching**
 *
 * The global symbol table along with a list of file URIs and checksums is cached in memory and is periodically saved to disk.
 *
 * The `TextDocument`s and file `AstNode`s (including their local symbol tables) managed by the client are stored in memory until the client sends a `didClose` notification.
 *
 * Some `TextDocument`s may be cached to avoid excessive reading from the file system.
 *
 * **INIT and READY**
 *
 * When a new instance of the {@link Project} class is constructed, its INIT and READY processes are immediately started in serial.
 *
 * During the INIT process of the project, the config and language feature initialization are processed.
 * The Promise returned by the {@link init} function resolves when the INIT process is complete.
 *
 * During the READY process of the project, the whole project is analyzed mainly to populate the global symbol table.
 * The Promise returned by the {@link ready} function resolves when the READY process is complete.
 *
 * The following generally happens during the READY process:
 * 1. A list of file URIs under the project is obtained.
 * 2. The global symbol cache, if available, is loaded and validated against the know list of files.
 *    A list of files that need to be (re)processed is returned in this step.
 * 3. For each files in the new list, the file is read, parsed, bound, and checked.
 *
 * **EDITING**
 *
 * After the READY process is complete, editing text documents as signaled by the client or the file watcher results in the file being re-processed.
 */
export class Project implements ExternalEventEmitter {
	private static readonly RootSuffix = '/pack.mcmeta'

	/** Prevent circular binding. */
	readonly #bindingInProgressUris = new Set<string>()
	readonly #cacheSaverIntervalId: IntervalId
	readonly cacheService: CacheService
	/** URI of files that are currently managed by the language client. */
	readonly #clientManagedUris = new Set<string>()
	readonly #clientManagedDocAndNodes = new Map<string, DocAndNode>()
	readonly #configService: ConfigService
	readonly #symbolUpToDateUris = new Set<string>()
	readonly #eventEmitter: ExternalEventEmitter
	readonly #initializers: readonly ProjectInitializer[]
	#initPromise!: Promise<void>
	#readyPromise!: Promise<void>
	readonly #watcher: FsWatcher | undefined
	get watchedFiles() {
		return this.#watcher?.watchedFiles ?? new Set()
	}

	#isReady = false
	get isReady(): boolean {
		return this.#isReady
	}

	config!: Config
	readonly downloader: Downloader
	readonly externals: Externals
	readonly fs: FileService
	readonly isDebugging: boolean
	readonly logger: Logger
	readonly meta = new MetaRegistry()
	readonly profilers: ProfilerFactory
	readonly projectRoots: RootUriString[]
	symbols: SymbolUtil

	#dependencyRoots: Set<RootUriString> | undefined
	#dependencyFiles: Set<string> | undefined

	#roots: readonly RootUriString[] = []
	/**
	 * All tracked root URIs. Each URI in this array is guaranteed to end with a slash (`/`).
	 *
	 * Includes the roots of all dependencies, the project root, and all data pack roots identified
	 * by `pack.mcmeta` files.
	 *
	 * Some URIs in the array may overlap with each other. In such cases, the deeper ones are guaranteed to come
	 * before the shallower ones (e.g. `file:///foo/bar/` will come before `file:///foo/`).
	 */
	get roots(): readonly RootUriString[] {
		return this.#roots
	}

	#ctx!: Record<string, string>
	/**
	 * Arbitrary information that will be included in the `project` property of all `Context`s.
	 */
	get ctx() {
		return this.#ctx
	}

	readonly #cacheRoot: RootUriString
	/**
	 * File URI to a directory where all cache files of Spyglass should be stored.
	 */
	get cacheRoot(): RootUriString {
		return this.#cacheRoot
	}

	private updateRoots(): void {
		const rawRoots = [...this.#dependencyRoots ?? [], ...this.projectRoots]
		const ans = new Set(rawRoots)
		// Identify roots indicated by `pack.mcmeta`.
		for (const file of this.getTrackedFiles()) {
			if (file.endsWith(Project.RootSuffix) && rawRoots.some((r) => file.startsWith(r))) {
				ans.add(file.slice(0, 1 - Project.RootSuffix.length) as RootUriString)
			}
		}
		this.#roots = [...ans].sort((a, b) => b.length - a.length)
		this.emit('rootsUpdated', { roots: this.#roots })
	}

	on(event: 'documentErrored', callbackFn: (data: DocumentErrorEvent) => void): this
	on(event: 'documentUpdated', callbackFn: (data: DocumentEvent) => void): this
	// `documentRemoved` uses a `FileEvent` instead of `DocumentEvent`, as it doesn't have access to
	// the document anymore.
	on(event: 'documentRemoved', callbackFn: (data: FileEvent) => void): this
	on(
		event: `file${'Created' | 'Modified' | 'Deleted'}`,
		callbackFn: (data: FileEvent) => void,
	): this
	on(event: 'ready', callbackFn: (data: EmptyEvent) => void): this
	on(event: 'rootsUpdated', callbackFn: (data: RootsEvent) => void): this
	on(event: 'symbolRegistrarExecuted', callbackFn: (data: SymbolRegistrarEvent) => void): this
	on(event: string, callbackFn: (...args: any[]) => unknown): this {
		this.#eventEmitter.on(event, callbackFn)
		return this
	}

	once(event: 'documentErrored', callbackFn: (data: DocumentErrorEvent) => void): this
	once(event: 'documentUpdated', callbackFn: (data: DocumentEvent) => void): this
	once(event: 'documentRemoved', callbackFn: (data: FileEvent) => void): this
	once(
		event: `file${'Created' | 'Modified' | 'Deleted'}`,
		callbackFn: (data: FileEvent) => void,
	): this
	once(event: 'ready', callbackFn: (data: EmptyEvent) => void): this
	once(event: 'rootsUpdated', callbackFn: (data: RootsEvent) => void): this
	once(event: 'symbolRegistrarExecuted', callbackFn: (data: SymbolRegistrarEvent) => void): this
	once(event: string, callbackFn: (...args: any[]) => unknown): this {
		this.#eventEmitter.once(event, callbackFn)
		return this
	}

	emit(event: 'documentErrored', data: DocumentErrorEvent): boolean
	emit(event: 'documentUpdated', data: DocumentEvent): boolean
	emit(event: 'documentRemoved', data: FileEvent): boolean
	emit(event: `file${'Created' | 'Modified' | 'Deleted'}`, data: FileEvent): boolean
	emit(event: 'ready', data: EmptyEvent): boolean
	emit(event: 'rootsUpdated', data: RootsEvent): boolean
	emit(event: 'symbolRegistrarExecuted', data: SymbolRegistrarEvent): boolean
	emit(event: string, ...args: unknown[]): boolean {
		return this.#eventEmitter.emit(event, ...args)
	}

	/**
	 * Get all files that are tracked and supported.
	 *
	 * Files in cached archives may not show up in the result as those files
	 * are not loaded into the memory.
	 */
	getTrackedFiles(): string[] {
		const extensions: string[] = this.meta.getSupportedFileExtensions()
		this.logger.info(`[Project#getTrackedFiles] Supported file extensions: ${extensions}`)
		const supportedFiles = [...this.#dependencyFiles ?? [], ...this.watchedFiles]
			.filter((file) => extensions.includes(fileUtil.extname(file) ?? ''))
		this.logger.info(
			`[Project#getTrackedFiles] Listed ${supportedFiles.length} supported files`,
		)
		return supportedFiles
	}

	constructor(
		{
			cacheRoot,
			defaultConfig,
			downloader,
			externals,
			fs = FileService.create(externals, cacheRoot),
			initializers = [],
			isDebugging = false,
			logger = Logger.create(),
			profilers = ProfilerFactory.noop(),
			projectRoots,
			projectRootsWatcher,
		}: ProjectOptions,
	) {
		this.#cacheRoot = cacheRoot
		this.#eventEmitter = new externals.event.EventEmitter()
		this.externals = externals
		this.fs = fs
		this.#initializers = initializers
		this.isDebugging = isDebugging
		this.logger = logger
		this.profilers = profilers
		this.projectRoots = projectRoots
		this.#watcher = projectRootsWatcher

		this.cacheService = new CacheService(cacheRoot, this)
		this.#configService = new ConfigService(this, defaultConfig)
		this.downloader = downloader ?? new Downloader(cacheRoot, externals, logger)
		this.symbols = new SymbolUtil({}, externals.event.EventEmitter)

		this.#ctx = {}

		this.logger.info(`[Project] [init] cacheRoot = ${cacheRoot}`)
		this.logger.info(`[Project] [init] projectRoots = ${projectRoots.join(' ')}`)

		this.#configService.on('changed', ({ config }) => {
			this.config = config
			this.logger.info('[Project] [Config] Changed')
		}).on(
			'error',
			({ error, uri }) => this.logger.error(`[Project] [Config] Failed loading ${uri}`, error),
		)

		this.setInitPromise()
		this.setReadyPromise()
		this.#cacheSaverIntervalId = setInterval(
			() => this.cacheService.save(),
			CacheAutoSaveInterval,
		)

		this.on('documentUpdated', ({ doc, node }) => {
			// if (!this.#isReady) {
			// 	return
			// }
			this.emit('documentErrored', {
				errors: FileNode.getErrors(node).map((e) => LanguageError.withPosRange(e, doc)),
				uri: doc.uri,
				version: doc.version,
			})
		}).on('documentRemoved', ({ uri }) => {
			this.emit('documentErrored', { errors: [], uri })
		}).on('fileCreated', async ({ uri }) => {
			if (uri.endsWith(Project.RootSuffix)) {
				this.updateRoots()
			}
			this.bindUri(uri)
			return this.ensureBindingStarted(uri)
		}).on('fileModified', async ({ uri }) => {
			this.#symbolUpToDateUris.delete(uri)
			if (this.isOnlyWatched(uri)) {
				await this.ensureBindingStarted(uri)
			}
		}).on('fileDeleted', ({ uri }) => {
			if (uri.endsWith(Project.RootSuffix)) {
				this.updateRoots()
			}
			this.#symbolUpToDateUris.delete(uri)
			this.symbols.clear({ uri })
			this.tryClearingCache(uri)
		}).on('ready', () => {
			this.#isReady = true
			// Recheck client managed files after the READY process, as they may have incomplete results and are user-facing.
			const promises: Promise<unknown>[] = []
			for (const { doc, node } of this.#clientManagedDocAndNodes.values()) {
				promises.push(this.check(doc, node))
			}
			Promise.all(promises).catch(e =>
				this.logger.error(
					'[Project#ready] Error occurred when rechecking client managed files after READY',
					e,
				)
			)
		})
	}

	private setInitPromise(): void {
		const callIntializers = async () => {
			const initCtx: ProjectInitializerContext = {
				cacheRoot: this.cacheRoot,
				config: this.config,
				downloader: this.downloader,
				externals: this.externals,
				isDebugging: this.isDebugging,
				logger: this.logger,
				meta: this.meta,
				projectRoots: this.projectRoots,
			}
			const results = await Promise.allSettled(this.#initializers.map((init) => init(initCtx)))
			let ctx: Record<string, string> = {}
			results.forEach(async (r, i) => {
				if (r.status === 'rejected') {
					this.logger.error(
						`[Project] [callInitializers] [${i}] “${this.#initializers[i].name}”`,
						r.reason,
					)
				} else if (r.value) {
					ctx = { ...ctx, ...r.value }
				}
			})
			this.#ctx = ctx
		}
		const init = async () => {
			const __profiler = this.profilers.get('project#init')

			const { symbols } = await this.cacheService.load()
			this.symbols = new SymbolUtil(symbols, this.externals.event.EventEmitter)
			this.symbols.buildCache()
			__profiler.task('Load Cache')

			this.config = await this.#configService.load()
			__profiler.task('Load Config')

			await callIntializers()
			__profiler.task('Initialize').finalize()
		}
		this.#initPromise = init()
	}

	private setReadyPromise(): void {
		const getDependencies = async () => {
			const ans: Dependency[] = []
			for (const dependency of this.config.env.dependencies) {
				if (DependencyKey.is(dependency)) {
					const provider = this.meta.getDependencyProvider(dependency)
					if (provider) {
						try {
							ans.push(await provider())
							this.logger.info(
								`[Project] [getDependencies] Executed provider “${dependency}”`,
							)
						} catch (e) {
							this.logger.error(
								`[Project] [getDependencies] Bad provider “${dependency}”`,
								e,
							)
						}
					} else {
						this.logger.error(
							`[Project] [getDependencies] Bad dependency “${dependency}”: no associated provider`,
						)
					}
				} else {
					ans.push({ uri: dependency })
				}
			}
			return ans
		}
		const listDependencyFiles = async () => {
			const dependencies = await getDependencies()
			const fileUriSupporter = await FileUriSupporter.create(
				dependencies,
				this.externals,
				this.logger,
			)
			const archiveUriSupporter = await ArchiveUriSupporter.create(
				dependencies,
				this.externals,
				this.logger,
			)
			this.fs.register('file:', fileUriSupporter, true)
			this.fs.register(ArchiveUriSupporter.Protocol, archiveUriSupporter, true)
		}
		const listProjectFiles = () =>
			new Promise<void>((resolve) => {
				if (!this.#watcher) {
					return resolve()
				}

				this.#watcher
					.on('add', (uri) => {
						if (this.shouldExclude(uri)) {
							return
						}
						this.emit('fileCreated', { uri })
					})
					.on('change', (uri) => {
						if (this.shouldExclude(uri)) {
							return
						}
						this.emit('fileModified', { uri })
					})
					.on('unlink', (uri) => {
						if (this.shouldExclude(uri)) {
							return
						}
						this.emit('fileDeleted', { uri })
					})
					.on('error', (e) => {
						this.logger.error('[Project#watcher]', e)
					})

				if (this.#watcher.isReady) {
					resolve()
				} else {
					this.#watcher.on('ready', resolve)
				}
			})
		const ready = async () => {
			await this.init()

			const __profiler = this.profilers.get('project#ready')

			await Promise.all([listDependencyFiles(), listProjectFiles()])

			this.#dependencyFiles = new Set(this.fs.listFiles())
			this.#dependencyRoots = new Set(this.fs.listRoots())

			this.updateRoots()
			__profiler.task('List URIs')

			for (const [id, { checksum, registrar }] of this.meta.symbolRegistrars) {
				const cacheChecksum = this.cacheService.checksums.symbolRegistrars[id]
				if (cacheChecksum === undefined || checksum !== cacheChecksum) {
					this.symbols.clear({ contributor: `symbol_registrar/${id}` })
					this.symbols.contributeAs(`symbol_registrar/${id}`, () => {
						registrar(this.symbols, { logger: this.logger })
					})
					this.emit('symbolRegistrarExecuted', { id, checksum })
				} else {
					this.logger.info(`[SymbolRegistrar] Skipped “${id}” thanks to cache ${checksum}`)
				}
			}
			__profiler.task('Register Symbols')

			for (const [uri, values] of Object.entries(this.cacheService.errors)) {
				this.emit('documentErrored', { errors: values, uri })
			}
			__profiler.task('Pop Errors')

			const { addedFiles, changedFiles, removedFiles } = await this.cacheService.validate()
			for (const uri of removedFiles) {
				this.emit('fileDeleted', { uri })
			}
			__profiler.task('Validate Cache')

			if (addedFiles.length > 0) {
				this.bindUri(addedFiles)
			}
			__profiler.task('Bind URIs')

			const files = [...addedFiles, ...changedFiles].sort(this.meta.uriSorter)
			__profiler.task('Sort URIs')

			const fileCountByExtension = new Map<string, number>()
			for (const file of files) {
				const ext = fileUtil.extname(file)?.replace(/^\./, '')
				if (ext) {
					fileCountByExtension.set(ext, (fileCountByExtension.get(ext) ?? 0) + 1)
				}
			}
			this.logger.info(`[Project#ready] == Files to bind ==`)
			for (const [ext, count] of fileCountByExtension.entries()) {
				this.logger.info(`[Project#ready] File extension ${ext}: ${count}`)
			}

			const __bindProfiler = this.profilers.get('project#ready#bind', 'top-n', 50)
			for (const uri of files) {
				await this.ensureBindingStarted(uri)
				__bindProfiler.task(uri)
			}
			__bindProfiler.finalize()
			__profiler.task('Bind Files')

			__profiler.finalize()
			this.emit('ready', {})
		}
		this.#isReady = false
		this.#readyPromise = ready()
	}

	/**
	 * Load the config file and initialize parsers and processors.
	 */
	async init(): Promise<this> {
		await this.#initPromise
		return this
	}

	/**
	 * Finish the initial run of parsing, binding, and checking the entire project.
	 */
	async ready(): Promise<this> {
		await this.#readyPromise
		return this
	}

	/**
	 * Behavior of the `Project` instance is undefined after this function has settled.
	 */
	async close(): Promise<void> {
		clearInterval(this.#cacheSaverIntervalId)
		await this.#watcher?.close()
		await this.cacheService.save()
	}

	async restart(): Promise<void> {
		try {
			this.#bindingInProgressUris.clear()
			this.#symbolUpToDateUris.clear()
			this.setReadyPromise()
			await this.ready()
		} catch (e) {
			this.logger.error('[Project#reset]', e)
		}
	}

	resetCache(): Promise<void> {
		this.logger.info('[Project#resetCache] Initiated...')

		// Clear existing errors.
		for (const uri of Object.keys(this.cacheService.errors)) {
			this.emit('documentErrored', { errors: [], uri })
		}

		// Reset cache.
		const { symbols } = this.cacheService.reset()
		this.symbols = new SymbolUtil(symbols, this.externals.event.EventEmitter)
		this.symbols.buildCache()

		return this.restart()
	}

	normalizeUri(uri: string): string {
		return this.fs.mapFromDisk(normalizeUri(uri))
	}

	private static readonly TextDocumentCacheMaxLength = 268435456
	readonly #textDocumentCache = new Map<string, Promise<TextDocument | undefined> | TextDocument>()
	#textDocumentCacheLength = 0
	private removeCachedTextDocument(uri: string): void {
		const doc = this.#textDocumentCache.get(uri)
		if (doc && !(doc instanceof Promise)) {
			this.#textDocumentCacheLength -= doc.getText().length
		}
		this.#textDocumentCache.delete(uri)
	}
	private async read(uri: string): Promise<TextDocument | undefined> {
		const getLanguageID = (uri: string): string => {
			const ext = fileUtil.extname(uri) ?? '.plaintext'
			return this.meta.getLanguageID(ext) ?? ext.slice(1)
		}
		const createTextDocument = async (uri: string): Promise<TextDocument | undefined> => {
			const languageId = getLanguageID(uri)
			if (!this.meta.isSupportedLanguage(languageId)) {
				return undefined
			}

			try {
				const content = bufferToString(await this.fs.readFile(uri))
				return TextDocument.create(uri, languageId, -1, content)
			} catch (e) {
				this.logger.warn(`[Project] [read] Failed creating TextDocument for ${uri}`, e)
				return undefined
			}
		}
		const trimCache = (): void => {
			const iterator = this.#textDocumentCache.keys()
			while (this.#textDocumentCacheLength > Project.TextDocumentCacheMaxLength) {
				const result = iterator.next()
				if (result.done) {
					throw new Error(
						`[Project] [read] Cache is too large with length ${this.#textDocumentCacheLength} even though it's empty; make sure to call 'removeCachedTextDocument()' instead of 'this.#textDocumentCache.delete()'`,
					)
				}
				this.removeCachedTextDocument(result.value)
			}
		}
		const getCacheHandlingPromise = async (uri: string): Promise<TextDocument | undefined> => {
			if (this.#textDocumentCache.has(uri)) {
				const ans = this.#textDocumentCache.get(uri)!
				// Move the entry to the end of the cache.
				// The goal is that more-frequently-used entries are preferably not trimmed.
				this.#textDocumentCache.delete(uri)
				this.#textDocumentCache.set(uri, ans)
				return ans
			} else {
				const promise = createTextDocument(uri)
				this.#textDocumentCache.set(uri, promise)

				// We replace the Promise in the cache with the TextDocument after it resolves,
				// or removes it from the cache if it resolves to undefined.
				const doc = await promise
				if (this.#textDocumentCache.get(uri) === promise) {
					// The Promise in the cache is the same as the one we created earlier.
					// This check is to make sure we don't set a wrong TextDocument to the cache in case the cache was modified elsewhere.
					if (doc) {
						this.#textDocumentCache.set(uri, doc)
						this.#textDocumentCacheLength += doc.getText().length
						trimCache()
					} else {
						this.#textDocumentCache.delete(uri)
					}
				}
				return doc
			}
		}

		uri = this.normalizeUri(uri)
		if (this.#clientManagedUris.has(uri)) {
			const result = this.#clientManagedDocAndNodes.get(uri)
			if (result) {
				return result.doc
			}
			throw new Error(
				`[Project] [read] Client-managed URI ${uri} does not have a TextDocument in the cache`,
			)
		}
		return getCacheHandlingPromise(uri)
	}

	private parse(doc: TextDocument): FileNode<AstNode> {
		const ctx = ParserContext.create(this, { doc })
		const parser = ctx.meta.getParserForLanguageId<AstNode>(ctx.doc.languageId)
		if (!parser) {
			return {
				type: 'file',
				range: Range.create(0),
				children: [],
				locals: Object.create(null),
				parserErrors: [],
			}
		}
		const src = new Source(doc.getText())
		return file(parser)(src, ctx)
	}

	@SingletonPromise()
	private async bind(doc: TextDocument, node: FileNode<AstNode>): Promise<void> {
		if (node.binderErrors) {
			return
		}
		try {
			this.#bindingInProgressUris.add(doc.uri)
			const binder = this.meta.getBinder(node.type)
			const ctx = BinderContext.create(this, { doc })
			ctx.symbols.clear({ contributor: 'binder', uri: doc.uri })
			await ctx.symbols.contributeAsAsync('binder', async () => {
				const proxy = StateProxy.create(node)
				await binder(proxy, ctx)
				node.binderErrors = ctx.err.dump()
			})
			this.#bindingInProgressUris.delete(doc.uri)
			this.#symbolUpToDateUris.add(doc.uri)
		} catch (e) {
			this.logger.error(`[Project] [bind] Failed for ${doc.uri} # ${doc.version}`, e)
		}
	}

	@SingletonPromise()
	private async check(doc: TextDocument, node: FileNode<AstNode>): Promise<void> {
		if (node.checkerErrors) {
			return
		}
		try {
			const checker = this.meta.getChecker(node.type)
			const ctx = CheckerContext.create(this, { doc })
			ctx.symbols.clear({ contributor: 'checker', uri: doc.uri })
			await ctx.symbols.contributeAsAsync('checker', async () => {
				await checker(StateProxy.create(node), ctx)
				node.checkerErrors = ctx.err.dump()
				this.lint(doc, node)
			})
		} catch (e) {
			this.logger.error(`[Project] [check] Failed for ${doc.uri} # ${doc.version}`, e)
		}
	}

	private lint(doc: TextDocument, node: FileNode<AstNode>): void {
		if (node.linterErrors) {
			return
		}

		node.linterErrors = []
		try {
			for (const [ruleName, rawValue] of Object.entries(this.config.lint)) {
				const result = LinterConfigValue.destruct(rawValue)
				if (!result) {
					// Rule is disabled (i.e. set to `null`) in the config.
					continue
				}

				const { ruleSeverity, ruleValue } = result
				const { configValidator, linter, nodePredicate } = this.meta.getLinter(ruleName)
				if (!configValidator(ruleName, ruleValue, this.logger)) {
					// Config value is invalid.
					continue
				}

				const ctx = LinterContext.create(this, {
					doc,
					err: new LinterErrorReporter(ruleName, ruleSeverity, this.ctx['errorSource']),
					ruleName,
					ruleValue,
				})

				traversePreOrder(node, () => true, () => true, (node) => {
					if (nodePredicate(node)) {
						const proxy = StateProxy.create(node)
						linter(proxy, ctx)
					}
				})
				;(node.linterErrors as LanguageError[]).push(...ctx.err.dump())
			}
		} catch (e) {
			this.logger.error(`[Project] [lint] Failed for ${doc.uri} # ${doc.version}`, e)
		}
	}

	// @SingletonPromise()
	async ensureBindingStarted(uri: string): Promise<void> {
		uri = this.normalizeUri(uri)
		if (this.#symbolUpToDateUris.has(uri) || this.#bindingInProgressUris.has(uri)) {
			return
		}

		this.#bindingInProgressUris.add(uri)

		const doc = await this.read(uri)
		if (!doc || !(await this.cacheService.hasFileChangedSinceCache(doc))) {
			return
		}

		const node = this.parse(doc)
		await this.bind(doc, node)
		this.emit('documentUpdated', { doc, node })
	}

	private bindUri(param: string | string[]): void {
		const ctx = UriBinderContext.create(this)
		if (typeof param === 'string') {
			ctx.symbols.clear({ contributor: 'uri_binder', uri: param })
		}
		ctx.symbols.contributeAs('uri_binder', () => {
			const uris = Array.isArray(param) ? param : [param]
			for (const binder of this.meta.uriBinders) {
				binder(uris, ctx)
			}
		})
	}

	/**
	 * Notify that a new document was opened in the editor.
	 */
	async onDidOpen(
		uri: string,
		languageID: string,
		version: number,
		content: string,
	): Promise<void> {
		uri = this.normalizeUri(uri)
		if (!fileUtil.isFileUri(uri)) {
			return // We only accept `file:` scheme for client-managed URIs.
		}
		if (this.shouldExclude(uri)) {
			return
		}
		const doc = TextDocument.create(uri, languageID, version, content)
		const node = this.parse(doc)
		this.#clientManagedUris.add(uri)
		this.#clientManagedDocAndNodes.set(uri, { doc, node })
		if (this.#isReady) {
			await this.bind(doc, node)
			await this.check(doc, node)
		}
	}

	/**
	 * Notify that an existing document was changed in the editor.
	 * @throws If there is no `TextDocument` corresponding to the URI.
	 */
	async onDidChange(
		uri: string,
		changes: TextDocumentContentChangeEvent[],
		version: number,
	): Promise<void> {
		uri = this.normalizeUri(uri)
		this.#symbolUpToDateUris.delete(uri)
		if (!fileUtil.isFileUri(uri)) {
			return // We only accept `file:` scheme for client-managed URIs.
		}
		if (this.shouldExclude(uri)) {
			return
		}
		const doc = this.#clientManagedDocAndNodes.get(uri)?.doc
		if (!doc) {
			throw new Error(
				`TextDocument for ${uri} is not cached. This should not happen. Did the language client send a didChange notification without sending a didOpen one, or is there a logic error on our side resulting the 'read' function overriding the 'TextDocument' created in the 'didOpen' notification handler?`,
			)
		}
		TextDocument.update(doc, changes, version)
		const node = this.parse(doc)
		this.#clientManagedDocAndNodes.set(uri, { doc, node })
		if (this.#isReady) {
			await this.bind(doc, node)
			await this.check(doc, node)
		}
	}

	/**
	 * Notify that an existing document was closed in the editor.
	 */
	onDidClose(uri: string): void {
		uri = this.normalizeUri(uri)
		if (!fileUtil.isFileUri(uri)) {
			return // We only accept `file:` scheme for client-managed URIs.
		}
		this.#clientManagedUris.delete(uri)
		this.#clientManagedDocAndNodes.delete(uri)
		this.tryClearingCache(uri)
	}

	@SingletonPromise()
	async ensureClientManagedChecked(uri: string): Promise<DocAndNode | undefined> {
		uri = this.normalizeUri(uri)
		const result = this.#clientManagedDocAndNodes.get(uri)
		if (result) {
			const { doc, node } = result
			if (this.#isReady) {
				await this.bind(doc, node)
				await this.check(doc, node)
				this.emit('documentUpdated', result)
			}
			return result
		}
		return undefined
	}

	getClientManaged(uri: string): DocAndNode | undefined {
		uri = this.normalizeUri(uri)
		return this.#clientManagedDocAndNodes.get(uri)
	}

	async showCacheRoot(): Promise<void> {
		if (!this.#cacheRoot) {
			return
		}

		try {
			await fileUtil.ensureDir(this.externals, this.#cacheRoot)
			await this.externals.fs.showFile(this.#cacheRoot)
		} catch (e) {
			this.logger.error('[Service#showCacheRoot]', e)
		}
	}

	public shouldExclude(uri: string): boolean {
		if (this.config.env.exclude.length === 0) {
			return false
		}
		for (const rel of fileUtil.getRels(uri, this.projectRoots)) {
			if (micromatch.any(rel, this.config.env.exclude)) {
				return true
			}
		}
		return false
	}

	private tryClearingCache(uri: string): void {
		if (this.shouldRemove(uri)) {
			this.removeCachedTextDocument(uri)
			this.emit('documentRemoved', { uri })
		}
	}

	private shouldRemove(uri: string): boolean {
		return (!this.#clientManagedUris.has(uri)
			&& !this.#dependencyFiles?.has(uri)
			&& !this.watchedFiles.has(uri))
	}

	private isOnlyWatched(uri: string): boolean {
		return (this.watchedFiles.has(uri)
			&& !this.#clientManagedUris.has(uri)
			&& !this.#dependencyFiles?.has(uri))
	}
}
