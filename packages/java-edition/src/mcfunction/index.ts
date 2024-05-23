import * as core from '@spyglassmc/core'
import * as mcf from '@spyglassmc/mcfunction'
import type { McmetaCommands, ReleaseVersion } from '../dependency/index.js'
import * as checker from './checker/index.js'
import * as colorizer from './colorizer/index.js'
import * as completer from './completer/index.js'
import { inlayHintProvider } from './inlayHintProvider.js'
import * as parser from './parser/index.js'
import { signatureHelpProvider } from './signatureHelpProvider.js'
import { getPatch } from './tree/patch.js'

export * as checker from './checker/index.js'
export * as colorizer from './colorizer/index.js'
export * as completer from './completer/index.js'
export * as parser from './parser/index.js'

/* istanbul ignore next */
export const initialize = (
	ctx: core.ProjectInitializerContext,
	commands: McmetaCommands,
	releaseVersion: ReleaseVersion,
) => {
	const { meta } = ctx

	const tree = core.merge(commands, getPatch(releaseVersion))

	mcf.initialize(ctx)

	meta.registerLanguage('mcfunction', {
		extensions: ['.mcfunction'],
		parser: mcf.entry(tree, parser.argument),
		completer: mcf.completer.entry(tree, completer.getMockNodes),
		triggerCharacters: [
			' ',
			'[',
			'=',
			'!',
			',',
			'{',
			':',
			'/',
			'.',
			'"',
			"'",
		],
	})

	meta.registerParser('mcfunction:block_predicate', parser.blockPredicate)
	meta.registerParser('mcfunction:component', parser.component)
	meta.registerParser('mcfunction:particle', parser.particle)
	meta.registerParser('mcfunction:tag', parser.tag())
	meta.registerParser('mcfunction:team', parser.team())
	meta.registerParser<mcf.CommandNode>(
		'mcfunction:command',
		mcf.command(
			tree,
			parser.argument,
		),
	)

	checker.register(meta)
	colorizer.register(meta)
	completer.register(meta)

	meta.registerInlayHintProvider(inlayHintProvider)
	meta.registerSignatureHelpProvider(signatureHelpProvider(tree))
}
