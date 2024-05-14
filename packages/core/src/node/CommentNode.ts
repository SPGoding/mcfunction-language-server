import type {
	DeepReadonly,
	PotentiallyReadonly,
	ReadWrite,
} from '../common/index.js'
import type { AstNode } from './AstNode.js'

export interface CommentNode extends AstNode {
	readonly type: 'comment'
	/**
	 * The actual comment with prefixes and suffixes removed.
	 */
	comment: string
}

export const CommentNode = Object.freeze({
	is<T extends DeepReadonly<AstNode> | undefined>(
		obj: T,
	): obj is PotentiallyReadonly<CommentNode, T> {
		return (obj as CommentNode | undefined)?.type === 'comment'
	},
})
