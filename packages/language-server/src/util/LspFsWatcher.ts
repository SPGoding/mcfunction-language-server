import * as core from '@spyglassmc/core'
import { NodeJsExternals } from '@spyglassmc/core/lib/nodejs.js'
import EventEmitter from 'events'
import * as ls from 'vscode-languageserver/node.js'

/**
 * A file system watcher based on Language Server Protocol's `workspace/didChangeWatchedFiles`
 * notification.
 */
export class LspFsWatcher extends EventEmitter implements core.FsWatcher {
	#ready = false
	readonly #readyPromise: Promise<void>
	readonly #watchedFiles = new Set<string>()
	#lspListener: ls.Disposable | undefined

	get isReady() {
		return this.#ready
	}
	get watchedFiles() {
		return this.#watchedFiles
	}

	constructor(
		readonly locations: core.FsLocation[],
		private readonly logger: core.Logger,
	) {
		super()
		this.#readyPromise = (async () => {
			try {
				for (const location of locations) {
					for (const uri of await core.fileUtil.getAllFiles(NodeJsExternals, location)) {
						this.#watchedFiles.add(uri)
					}
				}
				this.#ready = true
				this.emit('ready')
			} catch (e) {
				this.emit('error', e)
			}
		})()
	}

	setLspListener(listener: ls.Disposable) {
		this.#lspListener = listener
	}

	async close() {
		this.#lspListener?.dispose()
	}

	async onLspDidChangeWatchedFiles({ changes }: ls.DidChangeWatchedFilesParams) {
		if (!this.#ready) {
			await this.#readyPromise
		}

		for (const { type, uri } of changes) {
			try {
				switch (type) {
					case ls.FileChangeType.Created: {
						const stat = await (NodeJsExternals.fs.stat(uri))
						if (stat.isDirectory()) {
							// Find all files under the added URI and send 'add' events for them as well.
							for (const fileUri of await core.fileUtil.getAllFiles(NodeJsExternals, uri)) {
								if (!this.#watchedFiles.has(fileUri)) {
									this.emit('add', fileUri)
									this.#watchedFiles.add(fileUri)
								}
							}
						} else if (stat.isFile()) {
							if (!this.#watchedFiles.has(uri)) {
								this.emit('add', uri)
								this.#watchedFiles.add(uri)
							}
						}
						break
					}
					case ls.FileChangeType.Changed:
						this.emit('change', uri)
						if (!this.#watchedFiles.has(uri)) {
							this.#watchedFiles.add(uri)
							this.logger.warn(`[LspFsWatcher#handler] unknown changed file ${uri}`)
						}
						break
					case ls.FileChangeType.Deleted: {
						if (this.#watchedFiles.has(uri)) {
							this.emit('unlink', uri)
							this.#watchedFiles.delete(uri)
						} else {
							// Find all files under the deleted URI and send 'unlink' events for them as well.
							for (const watchedUri of this.#watchedFiles) {
								if (core.fileUtil.isSubUriOf(watchedUri, uri)) {
									this.emit('unlink', watchedUri)
									this.#watchedFiles.delete(watchedUri)
								}
							}
						}
						break
					}
				}
			} catch (e) {
				this.logger.error('[LspFsWatcher#handler]', e)
			}
		}
	}
}
