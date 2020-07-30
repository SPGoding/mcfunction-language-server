import { CodeAction, Diagnostic, Hover } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ParsingContext } from '../types'
import { LintConfig } from '../types/Config'
import { Formattable, GetFormattedString } from '../types/Formattable'
import { ErrorCode } from '../types/ParsingError'
import { areOverlapped, EmptyRange, isInRange, TextRange } from '../types/TextRange'

export const NodeType = Symbol('NodeType')
export const NodeRange = Symbol('NodeRange')
export const NodeDescription = Symbol('NbtNodeDescription')
export const GetCodeActions = Symbol('GetCodeActions')
export const FilterDiagnostics = Symbol('FilterDiagnostics')
export const GetHoverInformation = Symbol('GetHoverInformation')
export const GetPlainKeys = Symbol('GetPlainKeys')

export type DiagnosticMap = { [code in ErrorCode]?: Diagnostic[] }

const Triage = Symbol('Triage')

export abstract class ArgumentNode implements Formattable {
    abstract [NodeType]: string
    [NodeRange]: TextRange = EmptyRange;
    [NodeDescription]: string = '';

    [GetFormattedString](_lint?: LintConfig) {
        return this.toString()
    }

    [GetPlainKeys]() {
        return Object.keys(this)
    }

    /* istanbul ignore next: simple triage */
    private [Triage](func: (key: string) => any) {
        for (const key of this[GetPlainKeys]()) {
            func(key)
        }
    }

    protected [FilterDiagnostics](ctx: ParsingContext, diagnosticMap: DiagnosticMap, nodeRange = this[NodeRange]) {
        const ans: DiagnosticMap = {}
        for (const codeString in diagnosticMap) {
            /* istanbul ignore else */
            if (Object.prototype.hasOwnProperty.call(diagnosticMap, codeString)) {
                const code = codeString as unknown as ErrorCode
                const diagnostics = diagnosticMap[code]!
                for (const diag of diagnostics) {
                    const diagRange = {
                        start: ctx.textDoc.offsetAt(diag.range.start),
                        end: ctx.textDoc.offsetAt(diag.range.end)
                    }
                    if (areOverlapped(diagRange, nodeRange)) {
                        ans[code] = ans[code] ?? []
                        ans[code]!.push(diag)
                    }
                }
            }
        }
        return ans
    }

    /* istanbul ignore next: simple triage */
    [GetCodeActions](uri: string, ctx: ParsingContext, range: TextRange, diagnostics: DiagnosticMap) {
        const ans: CodeAction[] = []
        this[Triage](
            key => {
                const value = this[key as keyof this]
                const arr = value instanceof Array ? value : [value]
                for (const item of arr) {
                    if (item instanceof ArgumentNode && areOverlapped(range, item[NodeRange])) {
                        ans.push(...item[GetCodeActions](
                            uri, ctx, range, this[FilterDiagnostics](ctx, diagnostics, item[NodeRange])
                        ))
                    }
                }
            }
        )
        return ans
    }

    /* istanbul ignore next: simple triage */
    [GetHoverInformation](textDoc: TextDocument, offset: number) {
        let ans: Hover | null = null
        if (this[NodeDescription]) {
            ans = {
                contents: { kind: 'markdown', value: this[NodeDescription] },
                range: {
                    start: textDoc.positionAt(this[NodeRange].start),
                    end: textDoc.positionAt(this[NodeRange].end)
                }
            }
        } else {
            this[Triage](
                key => {
                    const value = this[key as keyof this]
                    const arr = value instanceof Array ? value : [value]
                    for (const item of arr) {
                        if (item instanceof ArgumentNode && isInRange(offset, item[NodeRange])) {
                            ans = item[GetHoverInformation](textDoc, offset)
                        }
                    }
                }
            )
        }
        return ans
    }
}
