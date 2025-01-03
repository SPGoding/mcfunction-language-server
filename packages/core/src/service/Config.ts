import rfdc from 'rfdc'
import type { ExternalEventEmitter } from '../common/index.js'
import { Arrayable, bufferToString, merge, TypePredicates } from '../common/index.js'
import { ErrorSeverity } from '../source/index.js'
import { DataFileCategories, FileCategories, RegistryCategories } from '../symbol/index.js'
import type { Project } from './Project.js'
/* eslint-disable no-restricted-syntax */

export interface Config {
	/**
	 * Environment settings. Unlike other configs, all involved root folders must have the same `env` settings. It is undocumented
	 * what would happen if two roots have conflicting `env` settings.
	 */
	env: EnvConfig
	/**
	 * Formatter rules.
	 */
	format: FormatterConfig
	/**
	 * t Linter rules.
	 */
	lint: LinterConfig
	/**
	 * Code snippets.
	 */
	snippet: SnippetsConfig
}

export interface CustomResourceConfig {
	/**
	 * The entry you have dispatched from mcdoc. (eg. `picoblaze:game_event`)
	 */
	category: string
	/**
	 * The file extension name of the dispatched resource. Only `.json` is supported for now.
	 */
	ext?: '.json'
	/**
	 * The pack type of the dispatched resource. Only `data` is supported for now.
	 */
	pack?: 'data'
	/**
	 * The first minecraft version the dispatched resource is available in.
	 */
	since?: `1.${number}`
	/**
	 * The first minecraft version the dispatched resource is no longer available in.
	 */
	until?: `1.${number}`
}

export interface EnvConfig {
	/**
	 * Where to download data like `mcmeta` or `vanilla-mcdoc` from (case-insensitive).
	 *
	 * * `GitHub`: Recommended, unless you have trouble connecting to `raw.githubusercontent.com`.
	 * * `fastly`
	 * * `jsDelivr`
	 * * A custom URL, with placeholder variables: `${user}`, `${repo}`, `${tag}`, and `${path}`.
	 */
	dataSource: string
	/**
	 * A list of data packs the current project depends on. Each value in this array can be either an absolute file path
	 * to a data pack folder or data pack archive (e.g. `.zip` or `.tar.gz`), or a special string like `@vanilla-mcdoc`.
	 */
	dependencies: string[]
	/**
	 * A list of file patterns to exclude.
	 */
	exclude: string[]
	/**
	 * **Experimental feature, breaking changes could occur.**
	 *
	 * Track changes at [issue #1254](https://github.com/SpyglassMC/Spyglass/issues/1254).
	 *
	 * Custom resources, currently only works for `minecraft:resource` JSON definitions dispatched from mcdoc.
	 */
	customResources: {
		[path: string]: CustomResourceConfig
	}
	feature: {
		codeActions: boolean
		colors: boolean
		completions: boolean
		documentHighlighting: boolean
		documentLinks: boolean
		foldingRanges: boolean
		formatting: boolean
		hover: boolean
		inlayHint: boolean | { enabledNodes: string[] }
		semanticColoring: boolean
		selectionRanges: boolean
		signatures: boolean
	}
	/**
	 * This field is case-insensitive.
	 *
	 * - `Auto`: Auto infer from `pack.mcmeta`.
	 * - `Latest release`
	 * - `Latest snapshot`
	 * - A version identifier or name found in [mcmeta's version data](https://github.com/misode/mcmeta/blob/summary/versions/data.json) that is older than `1.15` (inclusive).
	 */
	gameVersion: string
	/**
	 * Locale language for error messages and other texts provided by Spyglass.
	 */
	language: string
	/**
	 * Use custom files as mcmeta summaries.
	 *
	 * // TODO: Support file paths relative to the project root.
	 */
	mcmetaSummaryOverrides: Partial<
		Record<'blocks' | 'commands' | 'fluids' | 'registries', { path: string; replace?: boolean }>
	>
	permissionLevel: 1 | 2 | 3 | 4
	plugins: string[]
	/**
	 * Whether to enable caching of mcdoc simplified types.
	 *
	 * May become corrupt after changing game versions, so this is currently disabled by default.
	 */
	enableMcdocCaching: boolean
}

export type LinterSeverity = 'hint' | 'information' | 'warning' | 'error'
export namespace LinterSeverity {
	export function is(value: unknown): value is LinterSeverity {
		return (value === 'hint'
			|| value === 'information'
			|| value === 'warning'
			|| value === 'error')
	}
	export function toErrorSeverity(value: LinterSeverity): ErrorSeverity {
		switch (value) {
			case 'error':
				return ErrorSeverity.Error
			case 'hint':
				return ErrorSeverity.Hint
			case 'information':
				return ErrorSeverity.Information
			case 'warning':
				return ErrorSeverity.Warning
		}
	}
}

type BracketSpacingConfig = any
type SepSpacingConfig = any
export type QuoteConfig = {
	always?: boolean
	avoidEscape?: boolean | null
	type?: 'double' | 'single'
}

type LinterConfigValue<T> = T extends boolean ? null | T | [LinterSeverity, T] | LinterSeverity
	: null | T | [LinterSeverity, T]
export namespace LinterConfigValue {
	export function destruct(
		value: LinterConfigValue<boolean | string | number | object>,
	): { ruleSeverity: ErrorSeverity; ruleValue: boolean | string | number | object } | undefined {
		if (value === null || value === undefined) {
			return undefined
		}

		if (LinterSeverity.is(value)) {
			return { ruleSeverity: LinterSeverity.toErrorSeverity(value), ruleValue: true }
		}

		if (Array.isArray(value) && LinterSeverity.is(value[0])) {
			return { ruleSeverity: LinterSeverity.toErrorSeverity(value[0]), ruleValue: value[1] }
		}

		return { ruleSeverity: ErrorSeverity.Warning, ruleValue: value }
	}
}

export interface FormatterConfig {
	blockStateBracketSpacing: BracketSpacingConfig
	blockStateCommaSpacing: SepSpacingConfig
	blockStateEqualSpacing: SepSpacingConfig
	blockStateTrailingComma: boolean
	eol: 'auto' | 'CRLF' | 'LF'
	nbtArrayBracketSpacing: BracketSpacingConfig
	nbtArrayCommaSpacing: SepSpacingConfig
	nbtArraySemicolonSpacing: { after: number }
	nbtArrayTrailingComma: boolean
	nbtByteSuffix: 'b' | 'B'
	nbtCompoundBracketSpacing: BracketSpacingConfig
	nbtCompoundColonSpacing: SepSpacingConfig
	nbtCompoundCommaSpacing: SepSpacingConfig
	nbtCompoundTrailingComma: boolean
	nbtDoubleOmitSuffix: boolean
	nbtDoubleSuffix: 'd' | 'D'
	nbtFloatSuffix: 'f' | 'F'
	nbtListBracketSpacing: BracketSpacingConfig
	nbtListCommaSpacing: SepSpacingConfig
	nbtListTrailingComma: boolean
	nbtLongSuffix: 'l' | 'L'
	nbtShortSuffix: 's' | 'S'
	selectorBracketSpacing: BracketSpacingConfig
	selectorCommaSpacing: SepSpacingConfig
	selectorEqualSpacing: SepSpacingConfig
	selectorTrailingComma: boolean
	timeOmitTickUnit: boolean
}

export interface LinterConfig {
	// Sort key.
	blockStateSortKeys: LinterConfigValue<'alphabetically'>
	nbtCompoundSortKeys: LinterConfigValue<'alphabetically'>
	selectorSortKeys: LinterConfigValue<string[]>

	// Quote.
	commandStringQuote: LinterConfigValue<QuoteConfig>
	nbtKeyQuote: LinterConfigValue<QuoteConfig>
	nbtPathQuote: LinterConfigValue<QuoteConfig>
	nbtStringQuote: LinterConfigValue<QuoteConfig>
	selectorKeyQuote: LinterConfigValue<QuoteConfig>

	idOmitDefaultNamespace: LinterConfigValue<boolean>

	// Name convention.
	nameOfNbtKey: LinterConfigValue<string>
	nameOfObjective: LinterConfigValue<string>
	nameOfScoreHolder: LinterConfigValue<string>
	nameOfTag: LinterConfigValue<string>
	nameOfTeam: LinterConfigValue<string>

	// NBT.
	nbtArrayLengthCheck: LinterConfigValue<boolean>
	nbtBoolean: LinterConfigValue<boolean>
	nbtListLengthCheck: LinterConfigValue<boolean>
	nbtTypeCheck: LinterConfigValue<'strictly' | 'loosely'>

	undeclaredSymbol: LinterConfigValue<SymbolLinterConfig>
}

export interface SnippetsConfig {
	[label: string]: string
}

export type SymbolLinterConfig = Arrayable<SymbolLinterConfig.Complex> | SymbolLinterConfig.Action
export namespace SymbolLinterConfig {
	export function is(value: unknown): value is SymbolLinterConfig {
		return Arrayable.is(value, Complex.is) || Action.is(value)
	}

	export interface Complex {
		/**
		 * {@link Condition}s in this array are connected with OR.
		 */
		if?: Arrayable<Condition>
		then?: Action
		override?: Arrayable<Complex>
	}
	export namespace Complex {
		export function is(v: unknown): v is Complex {
			if (!v || typeof v !== 'object') {
				return false
			}
			const value = v as Complex
			return ((value.if === undefined || Arrayable.is(value.if, Condition.is))
				&& (value.then === undefined || Action.is(value.then))
				&& (value.override === undefined || Arrayable.is(value.override, Complex.is)))
		}
	}

	export interface Condition {
		category?: Arrayable<string>
		pattern?: Arrayable<string>
		excludePattern?: Arrayable<string>
		namespace?: Arrayable<string>
		excludeNamespace?: Arrayable<string>
	}
	export namespace Condition {
		export function is(v: unknown): v is Condition {
			if (!v || typeof v !== 'object') {
				return false
			}
			const value = v as Condition
			return ((value.category === undefined
				|| Arrayable.is(value.category, TypePredicates.isString))
				&& (value.pattern === undefined || Arrayable.is(value.pattern, TypePredicates.isString))
				&& (value.excludePattern === undefined
					|| Arrayable.is(value.excludePattern, TypePredicates.isString))
				&& (value.namespace === undefined
					|| Arrayable.is(value.namespace, TypePredicates.isString))
				&& (value.excludeNamespace === undefined
					|| Arrayable.is(value.excludeNamespace, TypePredicates.isString)))
		}
	}

	export interface DeclareAction {
		declare: 'block' | 'file' | 'public'
	}
	export interface ReportAction {
		report: LinterSeverity | 'inherit'
	}
	export type Action = DeclareAction | ReportAction
	export namespace Action {
		export function isDeclare(value: Action | undefined): value is DeclareAction {
			return (value !== undefined
				&& ['block', 'file', 'public'].includes((value as DeclareAction).declare))
		}
		export function isReport(value: Action | undefined): value is ReportAction {
			return (value !== undefined
				&& ['inherit', 'hint', 'information', 'warning', 'error'].includes(
					(value as ReportAction).report,
				))
		}
		export function is(v: unknown): v is Action {
			if (!v || typeof v !== 'object') {
				return false
			}
			const value = v as Action
			return isDeclare(value) || isReport(value)
		}
	}
}

/**
 * Config which simulates the default vanilla command system.
 */
export const VanillaConfig: Config = {
	env: {
		dataSource: 'GitHub',
		dependencies: ['@vanilla-datapack', '@vanilla-resourcepack', '@vanilla-mcdoc'],
		exclude: ['.*/**'],
		customResources: {},
		feature: {
			codeActions: true,
			colors: true,
			completions: true,
			documentHighlighting: true,
			documentLinks: true,
			foldingRanges: true,
			formatting: true,
			hover: true,
			inlayHint: {
				enabledNodes: [
					'boolean',
					'double',
					'float',
					'integer',
					'long',
					'mcfunction:coordinate',
					'mcfunction:vector',
					'mcfunction:command_child/unknown',
				],
			},
			semanticColoring: true,
			selectionRanges: true,
			signatures: true,
		},
		gameVersion: 'Auto',
		language: 'Default',
		permissionLevel: 2,
		plugins: [],
		mcmetaSummaryOverrides: {},
		enableMcdocCaching: false,
	},
	format: {
		blockStateBracketSpacing: { inside: 0 },
		blockStateCommaSpacing: { before: 0, after: 1 },
		blockStateEqualSpacing: { before: 0, after: 0 },
		blockStateTrailingComma: false,
		eol: 'auto',
		nbtArrayBracketSpacing: { inside: 0 },
		nbtArrayCommaSpacing: { before: 0, after: 1 },
		nbtArraySemicolonSpacing: { after: 1 },
		nbtArrayTrailingComma: false,
		nbtByteSuffix: 'b',
		nbtCompoundBracketSpacing: { inside: 0 },
		nbtCompoundColonSpacing: { before: 0, after: 1 },
		nbtCompoundCommaSpacing: { before: 0, after: 1 },
		nbtCompoundTrailingComma: false,
		nbtDoubleOmitSuffix: false,
		nbtDoubleSuffix: 'd',
		nbtFloatSuffix: 'f',
		nbtListBracketSpacing: { inside: 0 },
		nbtListCommaSpacing: { before: 0, after: 1 },
		nbtListTrailingComma: false,
		nbtLongSuffix: 'L',
		nbtShortSuffix: 's',
		selectorBracketSpacing: { inside: 0 },
		selectorCommaSpacing: { before: 0, after: 1 },
		selectorEqualSpacing: { before: 0, after: 0 },
		selectorTrailingComma: false,
		timeOmitTickUnit: false,
	},
	lint: {
		blockStateSortKeys: null,
		nbtCompoundSortKeys: null,
		selectorSortKeys: null,

		commandStringQuote: null,
		nbtKeyQuote: null,
		nbtPathQuote: null,
		nbtStringQuote: null,
		selectorKeyQuote: null,

		idOmitDefaultNamespace: null,

		nameOfNbtKey: null,
		nameOfObjective: null,
		nameOfScoreHolder: null,
		nameOfTag: null,
		nameOfTeam: null,

		nbtArrayLengthCheck: true,
		nbtBoolean: null,
		nbtListLengthCheck: null,
		nbtTypeCheck: 'loosely',

		undeclaredSymbol: [
			{
				if: [
					{ category: RegistryCategories, namespace: 'minecraft' },
					{ category: [...DataFileCategories, 'bossbar', 'objective', 'team'] },
				],
				then: { report: 'warning' },
			},
			{
				if: { category: ['attribute_modifier', 'attribute_modifier_uuid', 'tag'] },
				then: { declare: 'public' },
			},
			{
				then: { declare: 'block' },
			},
		],
	},
	snippet: {
		executeIfScoreSet:
			'execute if score ${1:score_holder} ${2:objective} = ${1:score_holder} ${2:objective} $0',
		summonAec:
			'summon minecraft:area_effect_cloud ~ ~ ~ {Age: -2147483648, Duration: -1, WaitTime: -2147483648, Tags: ["${1:tag}"]}',
	},
}

type ConfigEvent = { config: Config }
type ErrorEvent = { error: unknown; uri: string }

export class ConfigService implements ExternalEventEmitter {
	static readonly ConfigFileNames = Object.freeze(['spyglass.json', '.spyglassrc.json'] as const)

	readonly #eventEmitter: ExternalEventEmitter

	constructor(private readonly project: Project, private readonly defaultConfig = VanillaConfig) {
		this.#eventEmitter = new project.externals.event.EventEmitter()
		const handler = async ({ uri }: { uri: string }) => {
			if (ConfigService.isConfigFile(uri)) {
				this.emit('changed', { config: await this.load() })
			}
		}
		project.on('fileCreated', handler)
		project.on('fileModified', handler)
		project.on('fileDeleted', handler)
	}

	on(event: 'changed', callbackFn: (data: ConfigEvent) => void): this
	on(event: 'error', callbackFn: (data: ErrorEvent) => void): this
	on(event: string, callbackFn: (...args: any[]) => unknown): this {
		this.#eventEmitter.on(event, callbackFn)
		return this
	}

	once(event: 'changed', callbackFn: (data: ConfigEvent) => void): this
	once(event: 'error', callbackFn: (data: ErrorEvent) => void): this
	once(event: string, callbackFn: (...args: any[]) => unknown): this {
		this.#eventEmitter.once(event, callbackFn)
		return this
	}

	emit(event: 'changed', data: ConfigEvent): boolean
	emit(event: 'error', data: ErrorEvent): boolean
	emit(event: string, ...args: unknown[]): boolean {
		return this.#eventEmitter.emit(event, ...args)
	}

	async load(): Promise<Config> {
		const overrides = []
		for (const projectRoot of this.project.projectRoots) {
			for (const name of ConfigService.ConfigFileNames) {
				const uri = projectRoot + name
				try {
					const contents = await this.project.externals.fs.readFile(uri)
					overrides.push(JSON.parse(bufferToString(contents)))
				} catch (e) {
					if (this.project.externals.error.isKind(e, 'ENOENT')) {
						// File doesn't exist.
						continue
					}
					this.emit('error', { error: e, uri })
				}
				break
			}
		}
		return ConfigService.merge(this.defaultConfig, ...overrides)
	}

	private static isConfigFile(this: void, uri: string): boolean {
		return ConfigService.ConfigFileNames.some((n) => uri.endsWith(`/${n}`))
	}

	public static merge(base: Config, ...overrides: any[]): Config {
		return overrides.reduce(merge, rfdc()(base))
	}
}
