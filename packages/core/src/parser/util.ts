import type { AstNode } from '../node'
import { SequenceUtil } from '../node'
import type { ParserContext } from '../service'
import { ErrorReporter } from '../service'
import type { ErrorSeverity, ReadonlySource, Source } from '../source'
import { Range } from '../source'
import type { InfallibleParser, Parser, Result, Returnable } from './Parser'
import { Failure } from './Parser'

type ExtractNodeType<P extends Parser<Returnable>> = P extends Parser<infer V> ? V : never
/**
 * @template PA Parser array.
 */
type ExtractNodeTypes<PA extends Parser<Returnable>[]> = ExtractNodeType<PA[number]>

export interface AttemptResult<N extends Returnable = AstNode> {
	result: Result<N>,
	updateSrcAndCtx: () => void,
	endCursor: number,
	errorAmount: number,
}
interface InfallibleAttemptResult<N extends Returnable = AstNode> extends AttemptResult<N> {
	result: N,
}

/**
 * Attempts to parse using the given `parser`.
 * @returns
 * - `result`: The result returned by the `parser`.
 * - `updateSrcAndCtx`: A function that will update the passed-in `src` and `ctx` to the state where `parser` has been executed.
 * - `endCursor`: The offset where the `parser` stopped  parsing.
 * - `errorAmount`: The amount of errors created by the `parser`.
 */
export function attempt<N extends Returnable = AstNode>(parser: InfallibleParser<N>, src: Source, ctx: ParserContext): InfallibleAttemptResult<N>
export function attempt<N extends Returnable = AstNode>(parser: Parser<N>, src: Source, ctx: ParserContext): AttemptResult<N>
export function attempt<N extends Returnable = AstNode>(parser: Parser<N>, src: Source, ctx: ParserContext): AttemptResult<N> {
	const tmpSrc = src.clone()
	const tmpCtx = {
		...ctx,
		err: new ErrorReporter(),
		symbols: ctx.symbols.clone(),
	}

	const result = parser(tmpSrc, tmpCtx)

	return {
		result,
		endCursor: tmpSrc.cursor,
		errorAmount: tmpCtx.err.errors.length,
		updateSrcAndCtx: () => {
			src.innerCursor = tmpSrc.innerCursor
			ctx.err.absorb(tmpCtx.err)
			tmpCtx.symbols.applyDelayedEdits()
		},
	}
}

type SP<CN extends AstNode> = SIP<CN> | Parser<CN | SequenceUtil<CN> | undefined> | { get: (result: SequenceUtil<CN>) => Parser<CN | SequenceUtil<CN> | undefined> }
type SIP<CN extends AstNode> = InfallibleParser<CN | SequenceUtil<CN> | undefined> | { get: (result: SequenceUtil<CN>) => InfallibleParser<CN | SequenceUtil<CN> | undefined> }
/**
 * @template GN Gap node.
 * @template PA Parser array.
 * 
 * @param parseGap A parser that parses gaps between nodes in the sequence.
 * 
 * @returns A parser that takes a sequence built with the passed-in parsers.
 * 
 * `Failure` when any of the `parsers` returns a `Failure`.
 */
export function sequence<GN extends AstNode = never, PA extends SIP<AstNode>[] = SIP<AstNode>[]>(parsers: PA, parseGap?: InfallibleParser<GN[]>): InfallibleParser<SequenceUtil<GN | { [K in number]: PA[K] extends SP<infer V> ? V : never }[number]>>
export function sequence<GN extends AstNode = never, PA extends SP<AstNode>[] = SP<AstNode>[]>(parsers: PA, parseGap?: InfallibleParser<GN[]>): Parser<SequenceUtil<GN | { [K in number]: PA[K] extends SP<infer V> ? V : never }[number]>>
export function sequence(parsers: SP<AstNode>[], parseGap?: InfallibleParser<AstNode[]>): Parser<SequenceUtil<AstNode>> {
	return (src: Source, ctx: ParserContext): Result<SequenceUtil<AstNode>> => {
		const ans: SequenceUtil<AstNode> = {
			isSequenceUtil: true,
			children: [],
			range: Range.create(src),
		}

		for (const parser of parsers) {
			if (parseGap) {
				ans.children.push(...parseGap(src, ctx))
			}

			const result = (typeof parser === 'function' ? parser : parser.get(ans))(src, ctx)
			if (result === Failure) {
				return Failure
			} else if (result === undefined) {
				continue
			} else if (SequenceUtil.is(result)) {
				ans.children.push(...result.children)
			} else {
				ans.children.push(result)
			}
		}

		ans.range.end = src.cursor

		return ans
	}
}

/**
 * @template CN Child node.
 * 
 * @param parser Must be fallible, as an infallible parser being repeated will result in an infinite loop.
 * @param parseGap A parser that parses gaps between nodes in the sequence.
 * 
 * @returns A parser that takes a sequence with the passed-in parser being repeated zero or more times.
 */
export function repeat<CN extends AstNode>(parser: InfallibleParser<CN | SequenceUtil<CN>>, parseGap?: InfallibleParser<CN[]>): void
export function repeat<CN extends AstNode>(parser: Parser<CN | SequenceUtil<CN>>, parseGap?: InfallibleParser<CN[]>): InfallibleParser<SequenceUtil<CN>>
export function repeat<CN extends AstNode>(parser: Parser<CN | SequenceUtil<CN>>, parseGap?: InfallibleParser<CN[]>): InfallibleParser<SequenceUtil<CN>> {
	return (src: Source, ctx: ParserContext): SequenceUtil<CN> => {
		const ans: SequenceUtil<CN> = {
			isSequenceUtil: true,
			children: [],
			range: Range.create(src),
		}

		while (src.canRead()) {
			if (parseGap) {
				ans.children.push(...parseGap(src, ctx))
			}

			const { result, updateSrcAndCtx } = attempt(parser, src, ctx)

			if (result === Failure) {
				break
			}

			updateSrcAndCtx()
			if (SequenceUtil.is(result)) {
				ans.children.push(...result.children)
			} else {
				ans.children.push(result)
			}
		}

		ans.range.end = src.cursor

		return ans
	}
}

/**
 * @returns A parser that returns the result of the passed-in parser which produces the least amount of error.
 * If there are more than one `parsers` produced the same amount of errors, it then takes the parser that went the furthest in `Source`.
 * If there is still a tie, it takes the one closer to the beginning of the `parsers` array.
 * 
 * `Failure` when all of the `parsers` failed.
 */
export function any<PA extends [...Parser<Returnable>[], InfallibleParser<Returnable>]>(parsers: PA): InfallibleParser<ExtractNodeTypes<PA>>
export function any<PA extends Parser<Returnable>[]>(parsers: PA): Parser<ExtractNodeTypes<PA>>
export function any(parsers: Parser<Returnable>[]): Parser<Returnable> {
	return (src: Source, ctx: ParserContext): Result<Returnable> => {
		const attempts: AttemptResult<Returnable>[] = parsers
			.map(parser => attempt(parser, src, ctx))
			.filter(att => att.result !== Failure)
			.sort((a, b) => (b.endCursor - a.endCursor) || (a.errorAmount - b.errorAmount))
		if (attempts.length === 0) {
			return Failure
		}
		attempts[0].updateSrcAndCtx()
		return attempts[0].result
	}
}

/**
 * @returns A parser that fails when the passed-in parser didn't move the cursor at all.
 */
export function failOnEmpty<T extends Returnable>(parser: Parser<T>): Parser<T> {
	return (src, ctx) => {
		const start = src.cursor
		const { endCursor, updateSrcAndCtx, result } = attempt(parser, src, ctx)
		if (endCursor - start > 0) {
			updateSrcAndCtx()
			return result
		}
		return Failure
	}
}

/**
 * @returns A parser that takes an optional syntax component.
 */
export function optional<N extends Returnable>(parser: InfallibleParser<N>): void
export function optional<N extends Returnable>(parser: Parser<N>): InfallibleParser<N | undefined>
export function optional<N extends Returnable>(parser: Parser<N>): InfallibleParser<N | undefined> {
	// return any<N | undefined>([
	// 	parser,
	// 	empty,
	// ])
	return (src: Source, ctx: ParserContext): N | undefined => {
		const { result, updateSrcAndCtx } = attempt(parser, src, ctx)
		if (result === Failure) {
			return undefined
		} else {
			updateSrcAndCtx()
			return result
		}
	}
}

/**
 * @param parser Must be fallible.
 * 
 * @returns A parser that returns the return value of the `parser`, or the return value of `defaultValue` it it's a `Failure`.
 */
export function recover<N extends Returnable>(parser: InfallibleParser<N>, defaultValue: (src: Source, ctx: ParserContext) => N): void
export function recover<N extends Returnable>(parser: Parser<N>, defaultValue: (src: Source, ctx: ParserContext) => N): InfallibleParser<N>
export function recover<N extends Returnable>(parser: Parser<N>, defaultValue: (src: Source, ctx: ParserContext) => N): InfallibleParser<N> {
	return (src: Source, ctx: ParserContext): N => {
		const result = parser(src, ctx)
		if (result === Failure) {
			const ans = defaultValue(src, ctx)
			return ans
		}
		return result
	}
}

type Case = { predicate?: (this: void, src: ReadonlySource) => boolean, parser: Parser<Returnable> }

/**
 * @template CA Case array.
 */
export function select<CA extends readonly Case[]>(cases: CA): Parser<ExtractNodeType<CA[number]['parser']>>
export function select(cases: readonly Case[]): Parser<Returnable> {
	return (src: Source, ctx: ParserContext): Result<Returnable> => {
		for (const { predicate, parser } of cases) {
			if (predicate?.(src) ?? true) {
				return parser(src, ctx)
			}
		}
		return Failure
	}
}

/**
 * @returns A parser that returns the return value of `fn`.
 * 
 * `Failure` when the `parser` returns a `Failure`.
 */
export function map<NA extends Returnable, NB extends Returnable = NA>(parser: InfallibleParser<NA>, fn: (res: NA, src: Source, ctx: ParserContext) => NB): InfallibleParser<NB>
export function map<NA extends Returnable, NB extends Returnable = NA>(parser: Parser<NA>, fn: (res: NA, src: Source, ctx: ParserContext) => NB): Parser<NB>
export function map<NA extends Returnable, NB extends Returnable = NA>(parser: Parser<NA>, fn: (res: NA, src: Source, ctx: ParserContext) => NB): Parser<NB> {
	return (src: Source, ctx: ParserContext): Result<NB> => {
		const result = parser(src, ctx)
		if (result === Failure) {
			return Failure
		}
		const ans = fn(result, src, ctx)
		return ans
	}
}

/**
 * Checks if the result of `parser` is valid, and reports an error if it's not.
 * 
 * `Failure` when the `parser` returns a `Failure`.
 */
export function validate<N extends AstNode>(parser: InfallibleParser<N>, validator: (res: N, src: Source, ctx: ParserContext) => boolean, message: string, severity?: ErrorSeverity): InfallibleParser<N>
export function validate<N extends AstNode>(parser: Parser<N>, validator: (res: N, src: Source, ctx: ParserContext) => boolean, message: string, severity?: ErrorSeverity): Parser<N>
export function validate<N extends AstNode>(parser: Parser<N>, validator: (res: N, src: Source, ctx: ParserContext) => boolean, message: string, severity?: ErrorSeverity): Parser<N> {
	return map(
		parser,
		(res, src, ctx) => {
			const isLegal = validator(res, src, ctx)
			if (!isLegal) {
				ctx.err.report(message, res.range, severity)
			}
			return res
		}
	)
}

/**
 * @returns A parser that is based on the passed-in `parser`, but will never read to any of the terminator strings.
 */
export function stopBefore<N extends Returnable>(parser: InfallibleParser<N>, ...teminators: (string | readonly string[])[]): InfallibleParser<N>
export function stopBefore<N extends Returnable>(parser: Parser<N>, ...teminators: (string | readonly string[])[]): Parser<N>
export function stopBefore<N extends Returnable>(parser: Parser<N>, ...teminators: (string | readonly string[])[]): Parser<N> {
	const flatTerminators = teminators.flat()
	return (src, ctx): Result<N> => {
		const tmpSrc = src.clone()
		// Cut tmpSrc.string before the nearest terminator.
		tmpSrc.string = tmpSrc.string.slice(0, flatTerminators.reduce((p, c) => {
			const index = tmpSrc.string.indexOf(c, tmpSrc.innerCursor)
			return Math.min(p, index === -1 ? Infinity : index)
		}, Infinity))

		const ans = parser(tmpSrc, ctx)
		src.cursor = tmpSrc.cursor
		return ans
	}
}

/**
 * @returns A parser that is based on the passed-in `parser`, but will only read the acceptable characters.
 */
export function acceptOnly<N extends Returnable>(parser: InfallibleParser<N>, ...characters: (string | readonly string[])[]): InfallibleParser<N>
export function acceptOnly<N extends Returnable>(parser: Parser<N>, ...characters: (string | readonly string[])[]): Parser<N>
export function acceptOnly<N extends Returnable>(parser: Parser<N>, ...characters: (string | readonly string[])[]): Parser<N> {
	const set = new Set(characters.flat())
	return (src, ctx): Result<N> => {
		const tmpSrc = src.clone()
		// Cut tmpSrc.string before the nearest unacceptable character.
		for (let i = tmpSrc.innerCursor; i < tmpSrc.string.length; i++) {
			if (!set.has(tmpSrc.string.charAt(i))) {
				tmpSrc.string = tmpSrc.string.slice(0, i)
				break
			}
		}

		const ans = parser(tmpSrc, ctx)
		src.cursor = tmpSrc.cursor
		return ans
	}
}
