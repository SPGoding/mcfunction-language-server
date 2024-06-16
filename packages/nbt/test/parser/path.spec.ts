import { showWhitespaceGlyph, testParser } from '@spyglassmc/core/test-out/utils.js'
import { path } from '@spyglassmc/nbt/lib/parser/index.js'
import { describe, it } from 'mocha'
import snapshot from 'snap-shot-it'

describe('nbt path()', () => {
	const suites: { content: string }[] = [
		{ content: '' },
		{ content: '文字' },
		{ content: 'foo' },
		{ content: '"foo"' },
		{ content: "'foo'" },
		{ content: '{ }' },
		{ content: '[ ]' },
		{ content: 'foo{ }' },
		{ content: 'foo[ ]' },
		{ content: 'foo[ ].bar' },
		{ content: 'foo[ ][ ]' },
		{ content: 'foo[ ].[ ]' },
		{ content: 'foo[ 0 ]' },
		{ content: 'foo[ { } ]' },
		{ content: 'foo.[ ]' },
		{ content: 'foo.bar' },
		{ content: 'foo.{ }' },
		{ content: '{ }.foo' },
	]
	for (const { content } of suites) {
		it(`Parse "${showWhitespaceGlyph(content)}"`, () => {
			const parser = path
			snapshot(testParser(parser, content))
		})
	}
})
