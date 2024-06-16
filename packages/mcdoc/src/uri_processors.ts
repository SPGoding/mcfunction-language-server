import type { UriBinder, UriBinderContext, UriSorterRegistration } from '@spyglassmc/core'
import { fileUtil } from '@spyglassmc/core'
import { segToIdentifier } from './common.js'

const Extension = '.mcdoc'
const McdocRootPrefix = 'mcdoc/'

export const uriBinder: UriBinder = (uris: readonly string[], ctx: UriBinderContext) => {
	let urisAndRels: [string, string][] = []
	for (const uri of uris) {
		if (!uri.endsWith(Extension)) {
			continue
		}
		let rel = fileUtil.getRel(uri, ctx.roots)
		if (!rel) {
			continue
		}
		rel = rel.slice(0, -Extension.length).replace(/(^|\/)mod$/, '')
		urisAndRels.push([uri, rel])
	}
	// Now the value of `urisAndRels`:
	// file:///root/mcdoc/foo/mod.mcdoc -> mcdoc/foo
	// file:///root/mcdoc/foo/bar.mcdoc -> mcdoc/foo/bar

	// A special check for the directory named `mcdoc`:
	// If all files are put under this folder, we will treat that folder as the "root" instead.
	if (urisAndRels.every(([_, rel]) => rel.startsWith(McdocRootPrefix))) {
		urisAndRels = urisAndRels.map(([uri, rel]) => [uri, rel.slice(McdocRootPrefix.length)])
	}
	// Now the value of `urisAndRels`:
	// file:///root/mcdoc/foo/mod.mcdoc -> foo
	// file:///root/mcdoc/foo/bar.mcdoc -> foo/bar

	for (const [uri, rel] of urisAndRels) {
		ctx.symbols.query(uri, 'mcdoc', segToIdentifier(rel.split('/'))).ifKnown(() => {}).elseEnter({
			data: { subcategory: 'module' },
			usage: { type: 'definition' },
		})
	}
}

export const uriSorter: UriSorterRegistration = (a, b, next) => {
	if (a.endsWith(Extension) && !b.endsWith(Extension)) {
		return -1
	} else if (!a.endsWith(Extension) && b.endsWith(Extension)) {
		return 1
	} else {
		return next(a, b)
	}
}
