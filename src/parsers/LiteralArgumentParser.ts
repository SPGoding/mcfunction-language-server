import ArgumentParser from './ArgumentParser'
import ParsingError from '../types/ParsingError'
import StringReader from '../utils/StringReader'
import { ArgumentParserResult } from '../types/Parser'
import { CompletionItemKind } from 'vscode-languageserver'
import { arrayToMessage } from '../utils/utils'

export default class LiteralArgumentParser implements ArgumentParser<string> {
    private readonly literals: string[]

    constructor(literals: string[]) {
        if (literals.length === 0) {
            throw new Error("expected 'literals.length' to be more than 0")
        }
        this.literals = literals.sort()
    }

    parse(reader: StringReader): ArgumentParserResult<string> {
        const ans: ArgumentParserResult<string> = { data: '' }
        //#region Get completions.
        if (!reader.canRead()) {
            ans.completions = this.literals.map(v => ({ label: v, kind: CompletionItemKind.Text }))
        }
        //#endregion
        const start = reader.cursor
        const string = reader.readUntilOrEnd(' ')
        ans.data = string
        //#region Get errors.
        let isFullMatch = false
        let isPartialMatch = false
        for (const literal of this.literals) {
            if (literal === string) {
                isFullMatch = true
            } else if (literal.toLowerCase().startsWith(string.toLowerCase())) {
                isPartialMatch = true
            }
        }
        if (!isFullMatch) {
            if (isPartialMatch) {
                ans.errors = [new ParsingError(
                    { start: start, end: start + string.length },
                    `expected one of ${arrayToMessage(this.literals)} but got '${string}'`
                )]
            } else {
                ans.errors = [new ParsingError(
                    { start: start, end: start + string.length },
                    `expected one of ${arrayToMessage(this.literals)} but got '${string}'`,
                    false
                )]
            }
        }
        //#endregion

        return ans
    }

    toString(): string {
        if (this.literals.length === 1) {
            return this.literals[0]
        } else {
            return `(${this.literals.join('|')})`
        }
    }

    getExamples(): string[] {
        return this.literals
    }
}
