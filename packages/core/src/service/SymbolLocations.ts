import type { RangeLike } from '../source'
import { Range } from '../source'
import type { SymbolLocation } from '../symbol'

export interface SymbolLocations {
	/**
	 * The range of the currently selected symbol.
	 */
	range: Range,
	/**
	 * All locations of the symbol for the specific usage, or `null` if this symbol doesn't have the said usage.
	 */
	locations: SymbolLocation[] | null,
}
export namespace SymbolLocations {
	/* istanbul ignore next */
	export function create(range: RangeLike, locations: SymbolLocation[] | null): SymbolLocations {
		return {
			range: Range.get(range),
			locations,
		}
	}
}
