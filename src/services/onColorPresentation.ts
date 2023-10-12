import { TextDocument } from 'vscode-languageserver-textdocument'
import { ColorPresentation, Range } from 'vscode-languageserver/node'
import { round } from '../utils'

export function onColorPresentation({ textDoc, start, end, r, g, b }: { textDoc: TextDocument, start: number, end: number, r: number, g: number, b: number, a: number }) {
    try {
        const ans: ColorPresentation[] = []
        const range = Range.create(
            textDoc.positionAt(start),
            textDoc.positionAt(end)
        )
        const string = textDoc.getText(range)
        if (string.startsWith('dust')) {
            ans.push({ label: `dust ${round(r, 3)} ${round(g, 3)} ${round(b, 3)}` })
        } else if (string.startsWith('minecraft:dust')) {
            ans.push({ label: `minecraft:dust ${round(r, 3)} ${round(g, 3)} ${round(b, 3)}` })
        } else if (string.startsWith('#')) {
            const toHex = (v: number) => {
                const hex = v.toString(16)
                return hex.length === 1 ? `0${hex}` : hex
            }
            ans.push({ label: `#${toHex(r)}${toHex(g)}${toHex(b)}` })
        } else {
            ans.push({ label: `${(Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)}` })
        }

        return ans
    } catch (e) {
        console.error('[onColorPresentation]', e)
    }
    return null
}
