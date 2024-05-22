import type { DeepReadonly } from '../../common/index.js'
import type { AstNode } from '../../node/index.js'
import type { ColorizerContext } from '../../service/index.js'
import type { RangeLike } from '../../source/index.js'
import { Range } from '../../source/index.js'

export type Colorizer<N extends AstNode = AstNode> = (
	node: DeepReadonly<N>,
	ctx: ColorizerContext,
) => readonly ColorToken[]

export interface ColorToken {
	range: Range
	type: ColorTokenType
	modifiers?: ColorTokenModifier[]
}
export namespace ColorToken {
	/* istanbul ignore next */
	export function create(
		range: RangeLike,
		type: ColorTokenType,
		modifiers?: ColorTokenModifier[],
	): ColorToken {
		return {
			range: Range.get(range),
			type,
			modifiers,
		}
	}

	/**
	 * @returns An array of color tokens that cover the whole range of `targetRange`, with gaps in `tokens` filled
	 * with tokens created from the specified `type` and `modifiers`.
	 */
	export function fillGap(
		tokens: readonly ColorToken[],
		targetRange: Range,
		type: ColorTokenType,
		modifiers?: ColorTokenModifier[],
	): ColorToken[] {
		const ans: ColorToken[] = []
		let nextStart = Math.min(
			targetRange.start,
			tokens[0]?.range.start ?? Infinity,
		)
		for (const t of tokens) {
			if (t.range.start > nextStart) {
				ans.push(
					ColorToken.create(
						Range.create(nextStart, t.range.start),
						type,
						modifiers,
					),
				)
			}
			ans.push(t)
			nextStart = t.range.end
		}
		if (nextStart < targetRange.end) {
			ans.push(
				ColorToken.create(
					Range.create(nextStart, targetRange.end),
					type,
					modifiers,
				),
			)
		}
		return ans
	}
}

// Built-in LSP semantic tokens: https://microsoft.github.io/language-server-protocol/specifications/specification-3-17/#textDocument_semanticTokens

export const ColorTokenTypes = Object.freeze(
	[
		'comment', // Green
		'enum', // Teal
		'enumMember', // Neon Blue
		'function', // Purple
		'keyword', // Purple
		'modifier', // Purple
		'number', // Light Green
		'operator', // White?
		'property', // Light Blue
		'string', // Orange
		'struct', // Teal
		'type', // Teal
		'variable', // Light Blue
		// Below are custom types.
		'error',
		'literal',
		'operator',
		'resourceLocation',
		'vector',
	] as const,
)
export type ColorTokenType = typeof ColorTokenTypes[number]

export const ColorTokenModifiers = Object.freeze(
	[
		'declaration',
		'defaultLibrary',
		'definition',
		'deprecated',
		'documentation',
		'modification',
		'readonly',
		// Below are custom modifiers.
	] as const,
)
export type ColorTokenModifier = typeof ColorTokenModifiers[number]
