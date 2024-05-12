import { localize } from '@spyglassmc/locales'
import type { JsonNode } from '../../node/index.js'
import { JsonBooleanNode } from '../../node/index.js'
import type { JsonCheckerContext } from '../JsonChecker.js'

export function boolean(node: JsonNode, ctx: JsonCheckerContext) {
	node.expectation = [{ type: 'json:boolean', typedoc: 'Boolean' }]
	console.log('ne', node.expectation[0]!.type)

	if (!JsonBooleanNode.is(node)) {
		ctx.err.report(localize('expected', localize('boolean')), node)
	}
}
