// Pure geometry of canvas drops, all rects are in iframe viewport coordinates
export interface Rect {
	left: number
	top: number
	right: number
	bottom: number
}

export interface Point {
	x: number
	y: number
}

export type Axis = 'x' | 'y'

export interface Box {
	id: string
	rect: Rect
}

// Container under the pointer (or leaf) with the parent that would take a sibling
export interface Candidate {
	id: string
	rect: Rect
	// Can take children
	container: boolean
	kids: Box[]
	// Main axis from CSS, used when the children alone do not tell
	axis: Axis
	parent: { id: string; kids: Box[]; axis: Axis } | null
}

export interface Spot {
	parentId: string
	// Index among the parent's element children
	index: number
	// Insertion line, a rect with zero width or height
	line: Rect | null
	// Container highlighted when inserting inside it
	outline: Rect | null
}

const EDGE_MAX = 8

// Row layout when a child sits beside the previous one, otherwise a column
export const axisOf = (kids: Box[], hint: Axis = 'y'): Axis => {
	for (let i = 1; i < kids.length; i++) {
		const a = kids[i - 1].rect
		const b = kids[i].rect
		const overlap = b.top < a.bottom && a.top < b.bottom
		if (overlap && b.left >= a.right - 1) return 'x'
	}
	return kids.length >= 2 ? 'y' : hint
}

export const nearEdge = (p: Point, r: Rect) => {
	const m = Math.min(EDGE_MAX, (r.right - r.left) / 4, (r.bottom - r.top) / 4)
	return (
		p.x - r.left < m ||
		r.right - p.x < m ||
		p.y - r.top < m ||
		r.bottom - p.y < m
	)
}

const distance = (p: Point, r: Rect) => {
	const dx = Math.max(r.left - p.x, 0, p.x - r.right)
	const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
	return dx * dx + dy * dy
}

// Line at the edge of a sibling, across the axis the siblings are laid out on
export const edgeLine = (r: Rect, axis: Axis, after: boolean): Rect =>
	axis === 'y'
		? {
				left: r.left,
				right: r.right,
				top: after ? r.bottom : r.top,
				bottom: after ? r.bottom : r.top,
			}
		: {
				top: r.top,
				bottom: r.bottom,
				left: after ? r.right : r.left,
				right: after ? r.right : r.left,
			}

const beyondCenter = (p: Point, r: Rect, axis: Axis) =>
	axis === 'y' ? p.y > (r.top + r.bottom) / 2 : p.x > (r.left + r.right) / 2

// Nearest gap among siblings: index and the line drawn there
export const slotAmong = (kids: Box[], p: Point, axis: Axis) => {
	if (kids.length === 0) return { index: 0, line: null }
	let best = 0
	for (let i = 1; i < kids.length; i++) {
		if (distance(p, kids[i].rect) < distance(p, kids[best].rect)) best = i
	}
	const after = beyondCenter(p, kids[best].rect, axis)
	return {
		index: after ? best + 1 : best,
		line: edgeLine(kids[best].rect, axis, after),
	}
}

// Where a drop at the pointer lands: inside a container, or beside it or a leaf
export const spotAt = (c: Candidate, p: Point): Spot | null => {
	if (c.container && (!c.parent || !nearEdge(p, c.rect))) {
		const slot = slotAmong(c.kids, p, axisOf(c.kids, c.axis))
		return {
			parentId: c.id,
			index: slot.index,
			line: slot.line,
			outline: c.rect,
		}
	}
	if (!c.parent) return null
	const at = c.parent.kids.findIndex((k) => k.id === c.id)
	if (at < 0) return null
	const axis = axisOf(c.parent.kids, c.parent.axis)
	const after = beyondCenter(p, c.rect, axis)
	return {
		parentId: c.parent.id,
		index: after ? at + 1 : at,
		line: edgeLine(c.rect, axis, after),
		outline: null,
	}
}
