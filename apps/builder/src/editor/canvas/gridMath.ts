import {
	BREAKPOINTS,
	getUtility,
	resolveUtility,
	setUtility,
	type Breakpoint,
	type UtilityGroup,
} from '@ui-system/core'

// Pure grid math: tracks come from the computed style, positions are in one axis

export interface Track {
	start: number
	size: number
}

export type Axis = 'col' | 'row'

// Tailwind has spans 1-12 and lines 1-13
export const MAX_SPAN = 12
export const MAX_LINE = 13

// "100px [a] 200.5px" from a computed grid-template, "none" gives no tracks
export const parseTrackSizes = (value: string): number[] =>
	value
		.split(/\s+/)
		.map((token) => (token.endsWith('px') ? parseFloat(token) : NaN))
		.filter((n) => Number.isFinite(n))

// Free space before the first track for the justify-content / align-content values worth drawing
export const contentOffset = (free: number, mode: string) => {
	if (free <= 0) return 0
	if (mode === 'center') return free / 2
	if (mode === 'end' || mode === 'flex-end' || mode === 'right') return free
	return 0
}

export const buildTracks = (
	origin: number,
	sizes: number[],
	gap: number
): Track[] => {
	let start = origin
	return sizes.map((size) => {
		const track = { start, size }
		start += size + gap
		return track
	})
}

// Far edge of the last track
export const trackEnd = (tracks: Track[]) => {
	const last = tracks[tracks.length - 1]
	return last ? last.start + last.size : 0
}

interface Box {
	left: number
	top: number
	right: number
	bottom: number
}

// Free pieces of the gaps: column gaps per row, row gaps per column and their
// crossings, minus the pieces a spanning item covers
export const gapCells = ({
	cols,
	rows,
	colGap,
	rowGap,
	items,
}: {
	cols: Track[]
	rows: Track[]
	colGap: number
	rowGap: number
	items: Box[]
}): Box[] => {
	const spans = (tracks: Track[], gap: number) => ({
		tracks: tracks.map((t) => [t.start, t.start + t.size]),
		gaps:
			gap > 0
				? tracks
						.slice(0, -1)
						.map((t) => [t.start + t.size, t.start + t.size + gap])
				: [],
	})
	const x = spans(cols, colGap)
	const y = spans(rows, rowGap)
	const cells: Box[] = []
	const add = (xs: number[][], ys: number[][]) => {
		for (const [left, right] of xs) {
			for (const [top, bottom] of ys)
				cells.push({ left, top, right, bottom })
		}
	}
	add(x.gaps, y.tracks)
	add(x.tracks, y.gaps)
	add(x.gaps, y.gaps)
	const covered = (c: Box) => {
		const cx = (c.left + c.right) / 2
		const cy = (c.top + c.bottom) / 2
		return items.some(
			(i) => cx > i.left && cx < i.right && cy > i.top && cy < i.bottom
		)
	}
	return cells.filter((c) => !covered(c))
}

// Track under a position, the middle of a gap splits it between the neighbours
export const trackIndexAt = (tracks: Track[], pos: number) => {
	let index = 0
	for (let i = 0; i < tracks.length - 1; i++) {
		const edge = tracks[i].start + tracks[i].size
		const next = tracks[i + 1].start
		if (pos >= (edge + next) / 2) index = i + 1
	}
	return index
}

// Tracks covered by a child between two edges
export const areaOf = (tracks: Track[], from: number, to: number) => {
	if (tracks.length === 0) return { start: 0, span: 1 }
	const start = trackIndexAt(tracks, from + 0.5)
	const end = Math.max(start, trackIndexAt(tracks, to - 0.5))
	return { start, span: end - start + 1 }
}

// Span for a child that starts at a track when its far edge is dragged to a position
export const spanTo = (tracks: Track[], start: number, pos: number) => {
	const room = Math.max(1, tracks.length - start)
	return Math.min(room, Math.max(1, trackIndexAt(tracks, pos) - start + 1))
}

// Start track when a child is dragged by a point inside it, grab is the track it was held by
export const startAt = (
	tracks: Track[],
	pos: number,
	grab: number,
	span: number
) =>
	Math.max(
		0,
		Math.min(
			trackIndexAt(tracks, pos) - Math.min(grab, span - 1),
			Math.max(0, tracks.length - span)
		)
	)

const GROUPS = {
	col: { span: 'col-span', start: 'col-start' },
	row: { span: 'row-span', start: 'row-start' },
} as const

const before = (bp: Breakpoint) => {
	const order = BREAKPOINTS.map((b) => b.prefix as Breakpoint)
	const i = order.indexOf(bp)
	return i > 0 ? order[i - 1] : null
}

// col-span-* sets the whole grid-column, so a span on a wider screen drops a start
// inherited from a smaller one; this repeats such starts next to the span
export const pinStarts = (classes: string) =>
	(['col', 'row'] as const).reduce((next, axis) => {
		const { span, start } = GROUPS[axis]
		let carried: string | null = null
		for (const { prefix } of BREAKPOINTS) {
			const own = getUtility(next, start, prefix)
			if (own) carried = own
			else if (
				carried &&
				!carried.endsWith('-auto') &&
				getUtility(next, span, prefix)
			)
				next = setUtility(next, start, prefix, carried)
		}
		return next
	}, classes)

// Span 1 is the default, so it only needs a class when a smaller screen spans more
export const withSpan = (
	classes: string,
	axis: Axis,
	bp: Breakpoint,
	span: number
) => {
	const group = GROUPS[axis].span
	const lower = before(bp)
	const inherited = lower !== null && resolveUtility(classes, group, lower)
	const n = Math.max(1, Math.min(MAX_SPAN, Math.round(span)))
	return pinStarts(
		setUtility(
			classes,
			group,
			bp,
			n === 1 && !inherited ? null : `${group}-${n}`
		)
	)
}

// Explicit start line (0-based track index), null puts the child back in the flow
export const withStart = (
	classes: string,
	axis: Axis,
	bp: Breakpoint,
	index: number | null
) => {
	const group = GROUPS[axis].start
	const line = index === null ? null : Math.min(MAX_LINE, index + 1)
	return pinStarts(
		setUtility(
			classes,
			group,
			bp,
			line === null ? null : `${group}-${line}`
		)
	)
}

// Breakpoints wider than bp, smallest first
const above = (bp: Breakpoint) => {
	const order = BREAKPOINTS.map((b) => b.prefix as Breakpoint)
	return order.slice(order.indexOf(bp) + 1)
}

// Sets a utility at bp and drops the same group on wider screens, so the
// value is what the canvas shows from bp up
export const setFrom = (
	classes: string,
	group: UtilityGroup,
	bp: Breakpoint,
	utility: string | null
) =>
	above(bp).reduce(
		(next, wider) => setUtility(next, group, wider, null),
		setUtility(classes, group, bp, utility)
	)

// Placement of a grid item, cleared when a layout is applied
const ITEM_GROUPS: UtilityGroup[] = [
	'col-span',
	'col-start',
	'col-end',
	'row-span',
	'row-start',
	'row-end',
]

export const clearPlacement = (classes: string, bp: Breakpoint) =>
	ITEM_GROUPS.reduce((next, group) => setFrom(next, group, bp, null), classes)

// The column system: a grid whose items set their width in columns, 12 like Bootstrap by default
export const COLUMNS_12 = 'grid-cols-12'

// Column count of a grid-cols utility, no class means the one implicit column
export const colsCount = (utility: string | null | undefined) => {
	if (!utility) return 1
	const n = utility.match(/^grid-cols-(\d+)$/)?.[1]
	if (n) return Number(n)
	const template = utility.match(/^grid-cols-\[(.+)\]$/)?.[1]
	if (template && !template.includes('(')) return template.split('_').length
	return 1
}

export const columnsAt = (classes: string, bp: Breakpoint) =>
	colsCount(resolveUtility(classes, 'grid-cols', bp)?.utility)

// Grid at some screen, so its items can be sized in columns
export const isGridParent = (classes: string) =>
	BREAKPOINTS.some((b) =>
		['grid', 'inline-grid'].includes(
			getUtility(classes, 'display', b.prefix) ?? ''
		)
	)

// Items per row offered in the grid section
export const PER_ROW = Array.from({ length: 12 }, (_, i) => i + 1)

// Span each item gets when switching to 12 columns, so n equal columns stay n per row
const spanFor = (cols: string | undefined) => {
	const n = Number(cols?.match(/^grid-cols-(\d+)$/)?.[1] ?? 0)
	return n > 0 && 12 % n === 0 ? 12 / n : 12
}

const spanOf = (classes: string, bp: Breakpoint) =>
	Number(
		resolveUtility(classes, 'col-span', bp)?.utility.match(
			/^col-span-(\d+)$/
		)?.[1] ?? 1
	)

// Items per row at bp when every item spans the same share of the columns, null otherwise
export const perRowAt = (
	container: string,
	children: string[],
	bp: Breakpoint
) => {
	if (children.length === 0) return null
	const spans = children.map((classes) => spanOf(classes, bp))
	if (spans.some((span) => span !== spans[0])) return null
	const cols = columnsAt(container, bp)
	return cols % spans[0] === 0 ? cols / spans[0] : null
}

// n items per row at exactly bp: spans of cols / n when n divides the columns,
// otherwise that screen switches to n columns of one span each; null clears the spans
export const withPerRow = (
	container: string,
	children: string[],
	bp: Breakpoint,
	n: number | null
) => {
	if (n === null) {
		return {
			container,
			children: children.map((c) => setUtility(c, 'col-span', bp, null)),
		}
	}
	const cols = columnsAt(container, bp)
	const fits = cols % n === 0
	return {
		container: fits
			? container
			: setUtility(container, 'grid-cols', bp, `grid-cols-${n}`),
		children: children.map((c) =>
			pinStarts(
				setUtility(c, 'col-span', bp, `col-span-${fits ? cols / n : 1}`)
			)
		),
	}
}

// Layouts offered in the grid section
export interface GridLayout {
	id:
		| 'two'
		| 'three'
		| 'four'
		| 'third-two-thirds'
		| 'two-thirds-third'
		| 'mosaic'
		| 'twelve'
	cols: string
	// Spans the first child gets, none leaves children alone
	first?: { col: number; row: number }
}

export const GRID_LAYOUTS: GridLayout[] = [
	{ id: 'two', cols: 'grid-cols-2' },
	{ id: 'three', cols: 'grid-cols-3' },
	{ id: 'four', cols: 'grid-cols-4' },
	{ id: 'third-two-thirds', cols: 'grid-cols-[1fr_2fr]' },
	{ id: 'two-thirds-third', cols: 'grid-cols-[2fr_1fr]' },
	{
		id: 'mosaic',
		cols: 'grid-cols-3',
		first: { col: 2, row: 2 },
	},
	// Bootstrap-like row: items keep their look as spans of 12
	{ id: 'twelve', cols: COLUMNS_12 },
]

// Container and children classes after a layout: columns from bp up, no fixed
// rows and no leftover spans or positions, then the layout's own first item
export const layoutClasses = (
	layout: GridLayout,
	container: string,
	children: string[],
	bp: Breakpoint
) => ({
	container: setFrom(
		setFrom(container, 'grid-cols', bp, layout.cols),
		'grid-rows',
		bp,
		null
	),
	children: children.map((classes, i) => {
		const plain = clearPlacement(classes, bp)
		if (layout.cols === COLUMNS_12) {
			const cols = resolveUtility(container, 'grid-cols', bp)?.utility
			return withSpan(plain, 'col', bp, spanFor(cols))
		}
		if (i > 0 || !layout.first) return plain
		return withSpan(
			withSpan(plain, 'col', bp, layout.first.col),
			'row',
			bp,
			layout.first.row
		)
	}),
})

// Layout that matches the classes in effect at bp, so only one button lights up
export const activeLayout = (
	container: string,
	first: string | undefined,
	bp: Breakpoint
): GridLayout['id'] | null => {
	const cols = resolveUtility(container, 'grid-cols', bp)?.utility
	const span = (group: UtilityGroup) =>
		first ? (resolveUtility(first, group, bp)?.utility ?? null) : null
	const big =
		span('col-span') === 'col-span-2' && span('row-span') === 'row-span-2'
	const match = GRID_LAYOUTS.find(
		(layout) => layout.cols === cols && Boolean(layout.first) === big
	)
	return match?.id ?? null
}
