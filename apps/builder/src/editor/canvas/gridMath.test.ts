import { describe, expect, it } from 'vitest'
import {
	activeLayout,
	areaOf,
	buildTracks,
	gapCells,
	GRID_LAYOUTS,
	colsCount,
	isGridParent,
	perRowAt,
	pinStarts,
	withPerRow,
	layoutClasses,
	setFrom,
	contentOffset,
	parseTrackSizes,
	spanTo,
	startAt,
	trackEnd,
	trackIndexAt,
	withSpan,
	withStart,
} from '@/editor/canvas/gridMath'

// Three 100px columns with a 20px gap: 0-100, 120-220, 240-340
const cols = buildTracks(0, [100, 100, 100], 20)

describe('track geometry', () => {
	it('reads computed sizes and ignores names and keywords', () => {
		expect(parseTrackSizes('100px 200.5px')).toEqual([100, 200.5])
		expect(parseTrackSizes('[a] 10px [b] 20px')).toEqual([10, 20])
		expect(parseTrackSizes('none')).toEqual([])
	})

	it('lays tracks out with gaps', () => {
		expect(cols.map((c) => c.start)).toEqual([0, 120, 240])
		expect(trackEnd(cols)).toBe(340)
		expect(buildTracks(10, [50], 8)).toEqual([{ start: 10, size: 50 }])
	})

	it('finds the track under a position and clamps outside', () => {
		expect(trackIndexAt(cols, 50)).toBe(0)
		expect(trackIndexAt(cols, 109)).toBe(0)
		expect(trackIndexAt(cols, 111)).toBe(1)
		expect(trackIndexAt(cols, 300)).toBe(2)
		expect(trackIndexAt(cols, -40)).toBe(0)
		expect(trackIndexAt(cols, 999)).toBe(2)
		expect(trackIndexAt([], 5)).toBe(0)
	})

	it('works without gaps', () => {
		const flat = buildTracks(0, [50, 50], 0)
		expect(trackIndexAt(flat, 49)).toBe(0)
		expect(trackIndexAt(flat, 50)).toBe(1)
	})

	it('reads the area a child covers', () => {
		expect(areaOf(cols, 120, 340)).toEqual({ start: 1, span: 2 })
		expect(areaOf(cols, 0, 100)).toEqual({ start: 0, span: 1 })
		expect(areaOf(cols, 0, 340)).toEqual({ start: 0, span: 3 })
		expect(areaOf([], 0, 10)).toEqual({ start: 0, span: 1 })
	})

	it('turns a dragged edge into a span within the grid', () => {
		expect(spanTo(cols, 0, 225)).toBe(2)
		expect(spanTo(cols, 1, 225)).toBe(1)
		expect(spanTo(cols, 1, 900)).toBe(2)
		expect(spanTo(cols, 1, -50)).toBe(1)
	})

	it('keeps the held track under the pointer when placing', () => {
		expect(startAt(cols, 130, 0, 1)).toBe(1)
		expect(startAt(cols, 250, 1, 2)).toBe(1)
		// Would overflow the grid, so it stops at the last fitting start
		expect(startAt(cols, 300, 0, 2)).toBe(1)
		expect(startAt(cols, 10, 1, 2)).toBe(0)
	})

	it('offsets centered and end aligned tracks', () => {
		expect(contentOffset(100, 'center')).toBe(50)
		expect(contentOffset(100, 'end')).toBe(100)
		expect(contentOffset(100, 'normal')).toBe(0)
		expect(contentOffset(-5, 'center')).toBe(0)
	})
})

describe('grid classes', () => {
	it('writes spans per breakpoint', () => {
		expect(withSpan('p-4', 'col', 'md', 2)).toBe('p-4 md:col-span-2')
		expect(withSpan('md:col-span-2', 'col', 'md', 3)).toBe('md:col-span-3')
		expect(withSpan('p-4', 'row', '', 2)).toBe('p-4 row-span-2')
	})

	it('drops a span of one unless a smaller screen spans more', () => {
		expect(withSpan('col-span-2', 'col', '', 1)).toBe('')
		expect(withSpan('md:col-span-2', 'col', 'md', 1)).toBe('')
		expect(withSpan('col-span-2 md:col-span-3', 'col', 'md', 1)).toBe(
			'col-span-2 md:col-span-1'
		)
	})

	it('clamps spans and lines to what Tailwind has', () => {
		expect(withSpan('', 'col', '', 40)).toBe('col-span-12')
		expect(withStart('', 'col', '', 20)).toBe('col-start-13')
	})

	it('sets and clears the start line without touching the span', () => {
		const spanned = 'col-span-2 row-span-2'
		const placed = withStart(
			withStart(spanned, 'col', 'md', 1),
			'row',
			'md',
			0
		)
		expect(placed).toBe(
			'col-span-2 row-span-2 md:col-start-2 md:row-start-1'
		)
		expect(withStart(placed, 'col', 'md', null)).toBe(
			'col-span-2 row-span-2 md:row-start-1'
		)
	})
})

describe('gaps', () => {
	const rows = buildTracks(0, [50, 50], 10)
	it('splits gaps into free pieces', () => {
		// 2 column gaps x 2 rows, 3 columns x 1 row gap, 2 crossings: 4 + 3 + 2
		expect(
			gapCells({ cols, rows, colGap: 20, rowGap: 10, items: [] })
		).toHaveLength(9)
	})
	it('leaves out gaps under a spanning item', () => {
		const item = { left: 0, top: 0, right: 220, bottom: 110 }
		const cells = gapCells({
			cols,
			rows,
			colGap: 20,
			rowGap: 10,
			items: [item],
		})
		// The item covers the first column gap in both rows, two row gap pieces and one crossing
		expect(cells).toHaveLength(4)
		expect(cells.every((c) => c.left >= 220 || c.top >= 110)).toBe(true)
	})
})

describe('layouts', () => {
	const mosaic = GRID_LAYOUTS.find((l) => l.id === 'mosaic')!
	const three = GRID_LAYOUTS.find((l) => l.id === 'three')!

	it('sets columns from the chosen screen up', () => {
		expect(
			setFrom(
				'grid grid-cols-1 md:grid-cols-4',
				'grid-cols',
				'',
				'grid-cols-3'
			)
		).toBe('grid grid-cols-3')
		expect(
			setFrom(
				'grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6',
				'grid-cols',
				'md',
				'grid-cols-2'
			)
		).toBe('grid grid-cols-1 md:grid-cols-2')
	})

	it('clears fixed rows and old spans when a layout is applied', () => {
		const next = layoutClasses(
			three,
			'grid grid-rows-2 md:grid-cols-4',
			['btn col-span-2 row-span-2', 'btn md:col-start-3'],
			''
		)
		expect(next.container).toBe('grid grid-cols-3')
		expect(next.children).toEqual(['btn', 'btn'])
	})

	it('gives the mosaic its big first item', () => {
		const next = layoutClasses(
			mosaic,
			'grid md:grid-cols-4',
			['a', 'b'],
			''
		)
		expect(next.container).toBe('grid grid-cols-3')
		expect(next.children).toEqual(['a col-span-2 row-span-2', 'b'])
	})

	it('lights up one layout only', () => {
		expect(
			activeLayout('grid grid-cols-3', 'a col-span-2 row-span-2', '')
		).toBe('mosaic')
		expect(activeLayout('grid grid-cols-3', 'a', '')).toBe('three')
		expect(activeLayout('grid grid-cols-1 md:grid-cols-3', 'a', '')).toBe(
			null
		)
		expect(activeLayout('grid grid-cols-1 md:grid-cols-3', 'a', 'md')).toBe(
			'three'
		)
	})
})

describe('12-column rows', () => {
	const twelve = GRID_LAYOUTS.find((l) => l.id === 'twelve')!

	it('counts columns and spots grid parents', () => {
		expect(colsCount('grid-cols-5')).toBe(5)
		expect(colsCount('grid-cols-[1fr_2fr]')).toBe(2)
		expect(colsCount(null)).toBe(1)
		expect(isGridParent('flex md:grid')).toBe(true)
		expect(isGridParent('flex')).toBe(false)
	})

	it('keeps n equal columns as spans of 12 when switching', () => {
		const next = layoutClasses(twelve, 'grid grid-cols-3', ['a', 'b'], '')
		expect(next.container).toBe('grid grid-cols-12')
		expect(next.children).toEqual(['a col-span-4', 'b col-span-4'])
		const odd = layoutClasses(twelve, 'grid grid-cols-5', ['a'], '')
		expect(odd.children).toEqual(['a col-span-12'])
	})

	it('reads and writes items per row at one screen', () => {
		const row = 'grid grid-cols-12'
		const { container, children } = withPerRow(
			row,
			['a col-span-12', 'b col-span-12'],
			'md',
			3
		)
		expect(container).toBe(row)
		expect(children).toEqual([
			'a col-span-12 md:col-span-4',
			'b col-span-12 md:col-span-4',
		])
		expect(perRowAt(row, children, '')).toBe(1)
		expect(perRowAt(row, children, 'lg')).toBe(3)
		expect(perRowAt(row, ['a col-span-6', 'b col-span-4'], '')).toBeNull()
		expect(withPerRow(row, children, 'md', null).children).toEqual([
			'a col-span-12',
			'b col-span-12',
		])
	})

	it('switches the screen to n columns when n does not divide them', () => {
		const next = withPerRow('grid grid-cols-12', ['a', 'b'], 'lg', 5)
		expect(next.container).toBe('grid grid-cols-12 lg:grid-cols-5')
		expect(next.children).toEqual(['a lg:col-span-1', 'b lg:col-span-1'])
		expect(perRowAt(next.container, next.children, 'lg')).toBe(5)
		expect(perRowAt('grid grid-cols-6', ['a col-span-2'], '')).toBe(3)
	})
})

describe('pinStarts', () => {
	it('repeats an inherited start next to a wider span', () => {
		expect(pinStarts('lg:col-start-4 lg:col-span-6 xl:col-span-1')).toBe(
			'lg:col-start-4 lg:col-span-6 xl:col-span-1 xl:col-start-4'
		)
		expect(pinStarts('col-start-auto md:col-span-2')).toBe(
			'col-start-auto md:col-span-2'
		)
	})
})
