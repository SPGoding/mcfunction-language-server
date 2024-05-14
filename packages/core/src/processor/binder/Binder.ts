import type { AstNode } from '../../node/index.js'
import type { BinderContext } from '../../service/index.js'

const IsAsync = Symbol('IsAsyncBinder')

export type Binder<N extends AstNode> = SyncBinder<N> | AsyncBinder<N>

export interface SyncBinderInitializer<N extends AstNode> {
	(node: N, ctx: BinderContext): void
}
export interface SyncBinder<N extends AstNode>
	extends SyncBinderInitializer<N>
{
	[IsAsync]?: never
}
export namespace SyncBinder {
	export function create<N extends AstNode>(
		binder: SyncBinderInitializer<N>,
	): SyncBinder<N> {
		return binder
	}
	export function is(binder: Binder<any>): binder is SyncBinder<any> {
		return !(binder as AsyncBinder<any>)[IsAsync]
	}
}

interface AsyncBinderInitializer<N extends AstNode> {
	(node: N, ctx: BinderContext): Promise<void>
}
export interface AsyncBinder<N extends AstNode>
	extends AsyncBinderInitializer<N>
{
	[IsAsync]: true
}
export namespace AsyncBinder {
	export function create<N extends AstNode>(
		binder: AsyncBinderInitializer<N>,
	): AsyncBinder<N> {
		return Object.assign(binder, { [IsAsync]: true as const })
	}
	export function is(binder: Binder<any>): binder is AsyncBinder<any> {
		return (binder as AsyncBinder<any>)[IsAsync]
	}
}
