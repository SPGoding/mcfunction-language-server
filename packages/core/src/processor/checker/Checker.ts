import type { AstNode } from '../../node/index.js'
import type { CheckerContext } from '../../service/index.js'

export type Checker<N extends AstNode> = (node: N, ctx: CheckerContext) => PromiseLike<void> | void
export type SyncChecker<N extends AstNode> = (node: N, ctx: CheckerContext) => void
export type AsyncChecker<N extends AstNode> = (node: N, ctx: CheckerContext) => PromiseLike<void>

/* istanbul ignore next */
export const FallbackChecker: Checker<any> = () => Promise.resolve()
