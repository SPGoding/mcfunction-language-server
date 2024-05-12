import type {
	AllCategory,
	AstNode,
	Checker,
	Parser,
	ResourceLocationCategory,
	SyncChecker,
	TaggableResourceLocationCategory,
} from '@spyglassmc/core'
import * as core from '@spyglassmc/core'
import { Failure, Lazy, ResourceLocation } from '@spyglassmc/core'
import { localize } from '@spyglassmc/locales'
import type { JsonExpectation } from '../../node/index.js'
import { JsonStringNode } from '../../node/index.js'
import type { JsonChecker } from '../JsonChecker.js'

export function resource(
	id: TaggableResourceLocationCategory,
	allowTag?: boolean,
): JsonChecker
export function resource(
	id: ResourceLocationCategory | string[],
	allowTag?: false,
): JsonChecker
export function resource(
	id: ResourceLocationCategory | string[],
	allowTag = false,
): JsonChecker {
	return string(
		id,
		core.resourceLocation(
			typeof id === 'string'
				? { category: id as any, allowTag }
				: { pool: id.map(ResourceLocation.lengthen) },
		),
		core.checker.resourceLocation,
	)
}

export function literal(value: AllCategory | readonly string[]): JsonChecker {
	return typeof value === 'string'
		? string(value, core.symbol(value))
		: string(value, core.literal(...value))
}

export function string<T extends AstNode>(
	name: string | readonly string[] | undefined,
	parser: Lazy<Parser<T>>,
	checker?: Lazy<SyncChecker<T>>,
	expectation?: Partial<JsonExpectation>,
): JsonChecker
export function string(
	name?: string | readonly string[],
	parser?: undefined,
	checker?: Lazy<SyncChecker<JsonStringNode>>,
	expectation?: Partial<JsonExpectation>,
): JsonChecker
export function string(
	name?: string | readonly string[],
	parser?: Lazy<Parser<AstNode>>,
	checker?: Lazy<SyncChecker<any>>,
	expectation?: Partial<JsonExpectation>,
): JsonChecker {
	return (node, ctx) => {
		node.expectation = [
			{ type: 'json:string', typedoc: typedoc(name), ...expectation },
		]
		node.expectation = {
			0: { type: 'json:string', typedoc: typedoc(name), ...expectation },
		} as any
		// console.log('ne', node.expectation[0]!.type)
		if (!JsonStringNode.is(node)) {
			ctx.err.report(localize('expected', localize('string')), node)
		} else if (parser) {
			const result = core.parseStringValue(
				Lazy.resolve(parser),
				node.value,
				node.valueMap,
				ctx,
			)
			if (result !== Failure) {
				node.children = [result]
				result.parent = node
				if (checker) {
					Lazy.resolve(checker)(result, ctx)
				}
			}
		} else if (checker) {
			Lazy.resolve(checker)(node, ctx)
		}
	}
}

function typedoc(id?: string | readonly string[]) {
	if (!id) {
		return 'String'
	}
	if (typeof id === 'string') {
		return `String("${id}")`
	}
	return (
		id
			.slice(0, 10)
			.map((e) => `"${e}"`)
			.join(' | ') + (id.length > 10 ? ' | ...' : '')
	)
}

export const simpleString = string()
