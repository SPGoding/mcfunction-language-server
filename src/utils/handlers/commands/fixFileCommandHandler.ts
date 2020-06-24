import { CodeAction, Diagnostic, TextDocumentEdit, WorkspaceEdit } from 'vscode-languageserver'
import { getDiagnosticMap, getOrCreateInfo } from '..'
import { ArgumentNode, GetCodeActions } from '../../../nodes'
import { areOverlapped, CacheFile, FetchConfigFunction, FunctionInfo, GetCommandTreeFunction, GetVanillaDataFunction, InfosOfUris, ReadFileFunction, Uri } from '../../../types'

export async function fixFileCommandHandler({ uri, roots, infos, cacheFile, readFile, applyEdit, fetchConfig, getCommandTree, getVanillaData }: { uri: Uri, roots: Uri[], infos: InfosOfUris, cacheFile: CacheFile, readFile: ReadFileFunction, applyEdit: (edit: WorkspaceEdit) => void, fetchConfig: FetchConfigFunction, getCommandTree: GetCommandTreeFunction, getVanillaData: GetVanillaDataFunction }) {
    const config = await fetchConfig(uri)
    const commandTree = await getCommandTree(config.env.cmdVersion)
    const vanillaData = await getVanillaData(config.env.dataVersion, config.env.dataSource)
    const info = await getOrCreateInfo(uri, roots, infos, cacheFile, config, readFile, commandTree, vanillaData)
    /* istanbul ignore else */
    if (info) {
        const startTime = new Date().getTime()
        const edit = getMergedPreferredEdit(info, uri)
        const endTime = new Date().getTime()
        console.log(`--------------- Edit for ‘${uri.toString()}’ (${endTime - startTime} ms) ---------------`)
        console.log(JSON.stringify(edit, undefined, 4))

        if (edit) {
            applyEdit(edit)
        }
        // TODO: Finish command part when we have any quick fixes using it
    }
}

function getMergedPreferredEdit(info: FunctionInfo, uri: Uri) {
    const preferredActions = getActions(info, uri)
        .filter(v => v.isPreferred)

    return mergeActionEdit(info, preferredActions)
}

function getActions(info: FunctionInfo, uri: Uri) {
    const ans: CodeAction[] = []

    for (const node of info.nodes) {
        const diagnostics: Diagnostic[] = []
        node.errors?.forEach(err => diagnostics.push(err.toDiagnostic(info.document)))
        const diagnosticsMap = getDiagnosticMap(diagnostics)

        const selectedRange = { start: 0, end: Infinity }

        for (const { data } of node.args) {
            /* istanbul ignore else */
            if (data instanceof ArgumentNode) {
                ans.push(...data[GetCodeActions](uri.toString(), info, selectedRange, diagnosticsMap))
            }
        }
    }

    return ans
}

function mergeActionEdit(info: FunctionInfo, actions: CodeAction[]) {
    let ans: CodeAction | undefined

    if (actions.length > 0) {
        ans = actions[0]
        for (let i = 1; i < actions.length; i++) {
            const action = actions[i]
            ans.edit = ans.edit ?? {}
            ans.edit.documentChanges = ans.edit.documentChanges ?? []
            const upcommingChanges = action.edit?.documentChanges ?? []
            for (const upChange of upcommingChanges) {
                if (TextDocumentEdit.is(upChange)) {
                    let existingChange = ans.edit.documentChanges.find(
                        v => TextDocumentEdit.is(v) &&
                            v.textDocument.uri === upChange.textDocument.uri &&
                            v.textDocument.version === upChange.textDocument.version
                    ) as TextDocumentEdit | undefined
                    if (!existingChange) {
                        existingChange = { textDocument: upChange.textDocument, edits: [] }
                        ans.edit.documentChanges.push(existingChange)
                    }
                    for (const upEdit of upChange.edits) {
                        const upStart = info.document.offsetAt(upEdit.range.start)
                        const upEnd = info.document.offsetAt(upEdit.range.end)
                        const overlappedExistingEdit = existingChange.edits.find(v => {
                            const existingStart = info.document.offsetAt(v.range.start)
                            const existingEnd = info.document.offsetAt(v.range.end)
                            return areOverlapped(
                                { start: upStart, end: upEnd },
                                { start: existingStart, end: existingEnd }
                            )
                        })
                        if (!overlappedExistingEdit) {
                            existingChange.edits.push(upEdit)
                        }
                    }
                } else {
                    ans.edit.documentChanges.push(upChange)
                }
            }
        }
    }

    return ans?.edit
}
