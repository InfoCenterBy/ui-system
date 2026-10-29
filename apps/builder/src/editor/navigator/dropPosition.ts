export type Zone = 'before' | 'inside' | 'after'

const EDGE = 0.25

// Top quarter is before, bottom quarter after, the middle is inside
export const zoneAt = (
	y: number,
	top: number,
	height: number,
	canInside: boolean
): Zone => {
	const ratio = height > 0 ? (y - top) / height : 0.5
	if (!canInside) return ratio < 0.5 ? 'before' : 'after'
	if (ratio < EDGE) return 'before'
	if (ratio > 1 - EDGE) return 'after'
	return 'inside'
}

export interface Place {
	parentId: string
	index: number
}

export interface DropTarget {
	id: string
	parentId: string | null
	// Index in the parent's children, text nodes included
	index: number
	childCount: number
}

export interface DragSource {
	parentId: string
	index: number
}

// Parent and index for moveNodeTo, where index counts after the node is removed
export const resolveDrop = (
	zone: Zone,
	target: DropTarget,
	source: DragSource
): Place | null => {
	let place: Place
	if (zone === 'inside') {
		place = { parentId: target.id, index: target.childCount }
	} else {
		if (target.parentId === null) return null
		place = {
			parentId: target.parentId,
			index: zone === 'before' ? target.index : target.index + 1,
		}
	}
	if (place.parentId === source.parentId && source.index < place.index) {
		place.index -= 1
	}
	return place
}
