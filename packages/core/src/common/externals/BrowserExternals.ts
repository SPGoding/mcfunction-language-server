import { decode as arrayBufferFromBase64, encode as arrayBufferToBase64 } from 'base64-arraybuffer'
import pako from 'pako'
import { fileUtil } from '../../service/fileUtil.js'
import type {
	ExternalDownloader,
	ExternalDownloaderOptions,
	RemoteUriString,
} from './downloader.js'
import type { ExternalEventEmitter, ExternalFileSystem, Externals, FsLocation } from './index.js'

type Listener = (...args: unknown[]) => unknown
export class BrowserEventEmitter implements ExternalEventEmitter {
	readonly #listeners = new Map<string, { all: Set<Listener>; once: Set<Listener> }>()

	emit(eventName: string, ...args: unknown[]): boolean {
		const listeners = this.#listeners.get(eventName)
		if (!listeners?.all?.size) {
			return false
		}
		for (const listener of listeners.all) {
			listener(...args)
			if (listeners.once.has(listener)) {
				listeners.all.delete(listener)
				listeners.once.delete(listener)
			}
		}
		return false
	}

	on(eventName: string, listener: Listener): this {
		if (!this.#listeners.has(eventName)) {
			this.#listeners.set(eventName, { all: new Set(), once: new Set() })
		}
		const listeners = this.#listeners.get(eventName)!
		listeners.all.add(listener)
		return this
	}

	once(eventName: string, listener: Listener): this {
		if (!this.#listeners.has(eventName)) {
			this.#listeners.set(eventName, { all: new Set(), once: new Set() })
		}
		const listeners = this.#listeners.get(eventName)!
		listeners.all.add(listener)
		listeners.once.add(listener)
		return this
	}
}

class BrowserExternalDownloader implements ExternalDownloader {
	async get(uri: RemoteUriString, options: ExternalDownloaderOptions = {}): Promise<Uint8Array> {
		const headers = new Headers()
		for (const [name, value] of Object.entries(options?.headers ?? {})) {
			const values = typeof value === 'string' ? [value] : value
			for (const v of values) {
				headers.append(name, v)
			}
		}
		const res = await fetch(uri, { headers, redirect: 'follow' })
		if (!res.ok) {
			throw new Error(`Status code ${res.status}: ${res.ok}`)
		} else {
			return new Uint8Array(await res.arrayBuffer())
		}
	}
}

class BrowserFileSystem implements ExternalFileSystem {
	private static readonly LocalStorageKey = 'spyglassmc-browser-fs'
	private states: Record<string, { type: 'file'; content: string } | { type: 'directory' }>

	constructor() {
		this.states = JSON.parse(localStorage.getItem(BrowserFileSystem.LocalStorageKey) ?? '{}')
	}

	private saveStates() {
		localStorage.setItem(BrowserFileSystem.LocalStorageKey, JSON.stringify(this.states))
	}

	async chmod(_location: FsLocation, _mode: number): Promise<void> {
		return
	}
	async mkdir(
		location: FsLocation,
		_options?: { mode?: number | undefined; recursive?: boolean | undefined } | undefined,
	): Promise<void> {
		location = fileUtil.ensureEndingSlash(location.toString())
		if (this.states[location]) {
			throw new Error(`EEXIST: ${location}`)
		}
		this.states[location] = { type: 'directory' }
		this.saveStates()
	}
	async readdir(_location: FsLocation) {
		// Not implemented
		return []
	}
	async readFile(location: FsLocation): Promise<Uint8Array> {
		location = location.toString()
		const entry = this.states[location]
		if (!entry) {
			throw new Error(`ENOENT: ${location}`)
		} else if (entry.type === 'directory') {
			throw new Error(`EISDIR: ${location}`)
		}
		return new Uint8Array(arrayBufferFromBase64(entry.content))
	}
	async showFile(_path: FsLocation): Promise<void> {
		throw new Error('showFile not supported on browser')
	}
	async stat(location: FsLocation): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
		location = location.toString()
		const entry = this.states[location]
		if (!entry) {
			throw new Error(`ENOENT: ${location}`)
		}
		return { isDirectory: () => entry.type === 'directory', isFile: () => entry.type === 'file' }
	}
	async unlink(location: FsLocation): Promise<void> {
		location = location.toString()
		const entry = this.states[location]
		if (!entry) {
			throw new Error(`ENOENT: ${location}`)
		}
		delete this.states[location]
		this.saveStates()
	}
	async writeFile(
		location: FsLocation,
		data: string | Uint8Array,
		_options?: { mode: number } | undefined,
	): Promise<void> {
		location = location.toString()
		if (typeof data === 'string') {
			data = new TextEncoder().encode(data)
		}
		data = arrayBufferToBase64(data)
		this.states[location] = { type: 'file', content: data }
		this.saveStates()
	}
}

export const BrowserExternals: Externals = {
	archive: {
		decompressBall(_buffer, _options) {
			throw new Error('decompressBall not supported on browser.')
		},
		async gunzip(buffer) {
			return pako.inflate(buffer)
		},
		async gzip(buffer) {
			return pako.gzip(buffer)
		},
	},
	crypto: {
		async getSha1(data) {
			if (typeof data === 'string') {
				data = new TextEncoder().encode(data)
			}
			const hash = await crypto.subtle.digest('SHA-1', data)
			return uint8ArrayToHex(new Uint8Array(hash))
		},
	},
	downloader: new BrowserExternalDownloader(),
	error: {
		createKind(kind, message) {
			return new Error(`${kind}: ${message}`)
		},
		isKind(e, kind) {
			return e instanceof Error && e.message.startsWith(kind)
		},
	},
	event: { EventEmitter: BrowserEventEmitter },
	fs: new BrowserFileSystem(),
}

function uint8ArrayToHex(array: Uint8Array) {
	let ans = ''
	for (const v of array) {
		ans += v.toString(16).padStart(2, '0')
	}
	return ans
}

Object.freeze(BrowserExternals)
