import * as core from '@spyglassmc/core'
import { Range } from '@spyglassmc/core'
import type { JsonBooleanNode } from '../node'

export const boolean: core.Parser<JsonBooleanNode> = (src, ctx) => {
	const start = src.cursor
	if (src.trySkip('false')) {
		return {
			type: 'json:boolean',
			range: Range.create(start, src),
			value: false,
		}
	}
	if (src.trySkip('true')) {
		return {
			type: 'json:boolean',
			range: Range.create(start, src),
			value: true,
		}
	}
	return core.Failure
}
