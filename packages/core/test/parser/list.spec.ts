import { describe, it } from 'mocha'
import snapshot from 'snap-shot-it'
import type { StringNode } from '../../lib/index.js'
import { list, string } from '../../lib/index.js'
import type { Options } from '../../lib/parser/list.js'
import { showWhitespaceGlyph, testParser } from '../utils.js'

describe('list()', () => {
	const quotedString = string({ quotes: ['"'] })
	const suites: { title: string; options: Options<StringNode>; contents: string[] }[] = [{
		title: 'list(no trailing comma)',
		options: { start: '[', value: quotedString, sep: ',', trailingSep: false, end: ']' },
		contents: [
			'',
			'[',
			'[ ]',
			'[ , ]',
			'[ , "foo" ]',
			'[ "foo" ]',
			'[ "foo" , ]',
			'[ "foo"   "bar" ]',
			'[ "foo" , "bar" ]',
			'[ "foo" , "bar" , ]',
		],
	}, {
		title: 'list(trailing comma)',
		options: { start: '[', value: quotedString, sep: ',', trailingSep: true, end: ']' },
		contents: ['[ "foo" ]', '[ "foo" , ]', '[ "foo" , "bar" ]', '[ "foo" , "bar" , ]'],
	}]
	for (const { title, options, contents } of suites) {
		describe(title, () => {
			for (const content of contents) {
				it(`Parse "${showWhitespaceGlyph(content)}"`, () => {
					const parser = list(options)
					snapshot(testParser(parser, content))
				})
			}
		})
	}
})
