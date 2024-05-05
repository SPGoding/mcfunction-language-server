import type * as core from '@spyglassmc/core'
import type { CommandMacroNode, CommandNode } from './command.js'

export interface McfunctionNode
	extends core.SequenceNode<CommandNode | CommandMacroNode | core.CommentNode>
{
	type: 'mcfunction:entry'
}
export namespace McfunctionNode {
	/* istanbul ignore next */
	export function is(node: core.AstNode | undefined): node is McfunctionNode {
		return (node as McfunctionNode | undefined)?.type === 'mcfunction:entry'
	}
}
