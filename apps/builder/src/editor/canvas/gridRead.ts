import {
	buildTracks,
	contentOffset,
	parseTrackSizes,
	trackEnd,
	type Track,
} from '@/editor/canvas/gridMath'

export interface Rect {
	left: number
	top: number
	right: number
	bottom: number
}

export interface GridInfo {
	cols: Track[]
	rows: Track[]
	colGap: number
	rowGap: number
	// Boxes of the items in the flow, a gap under a spanning item is not free
	items: Rect[]
}

export const isGridElement = (el: Element | null) => {
	if (!el) return false
	const display = el.ownerDocument.defaultView?.getComputedStyle(el).display
	return display === 'grid' || display === 'inline-grid'
}

const px = (value: string) => parseFloat(value) || 0

// Tracks of any grid element in iframe viewport pixels, from the browser's resolved values
export const readGrid = (el: Element): GridInfo | null => {
	const win = el.ownerDocument.defaultView
	if (!win || !isGridElement(el)) return null
	const style = win.getComputedStyle(el)
	const rect = el.getBoundingClientRect()
	const colSizes = parseTrackSizes(style.gridTemplateColumns)
	const rowSizes = parseTrackSizes(style.gridTemplateRows)
	if (colSizes.length === 0 || rowSizes.length === 0) return null
	// normal is the default and means no gap
	const colGap = px(style.columnGap)
	const rowGap = px(style.rowGap)
	const left = rect.left + px(style.borderLeftWidth) + px(style.paddingLeft)
	const top = rect.top + px(style.borderTopWidth) + px(style.paddingTop)
	const innerWidth =
		rect.width -
		px(style.borderLeftWidth) -
		px(style.borderRightWidth) -
		px(style.paddingLeft) -
		px(style.paddingRight)
	const innerHeight =
		rect.height -
		px(style.borderTopWidth) -
		px(style.borderBottomWidth) -
		px(style.paddingTop) -
		px(style.paddingBottom)
	const cols = buildTracks(left, colSizes, colGap)
	const rows = buildTracks(top, rowSizes, rowGap)
	const dx = contentOffset(
		innerWidth - (trackEnd(cols) - left),
		style.justifyContent
	)
	const dy = contentOffset(
		innerHeight - (trackEnd(rows) - top),
		style.alignContent
	)
	const items = Array.from(el.children)
		.filter((child) => {
			const position = win.getComputedStyle(child).position
			return position !== 'absolute' && position !== 'fixed'
		})
		.map((child) => child.getBoundingClientRect())
		.filter((r) => r.width > 0 && r.height > 0)
		.map(({ left, top, right, bottom }) => ({ left, top, right, bottom }))
	return {
		cols: cols.map((t) => ({ ...t, start: t.start + dx })),
		rows: rows.map((t) => ({ ...t, start: t.start + dy })),
		colGap,
		rowGap,
		items,
	}
}
