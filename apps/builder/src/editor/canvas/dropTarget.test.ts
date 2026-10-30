import { describe, expect, it } from 'vitest'
import {
	axisOf,
	nearEdge,
	spotAt,
	type Box,
	type Candidate,
} from './dropTarget'

const box = (
	id: string,
	left: number,
	top: number,
	w: number,
	h: number
): Box => ({
	id,
	rect: { left, top, right: left + w, bottom: top + h },
})

const column = [box('a', 0, 0, 100, 40), box('b', 0, 50, 100, 40)]
const row = [box('a', 0, 0, 50, 100), box('b', 60, 0, 50, 100)]

describe('axisOf', () => {
	it('is a column for stacked children', () => {
		expect(axisOf(column)).toBe('y')
	})
	it('is a row for children side by side', () => {
		expect(axisOf(row)).toBe('x')
	})
	it('uses the hint for a single child', () => {
		expect(axisOf([row[0]], 'x')).toBe('x')
		expect(axisOf([])).toBe('y')
	})
})

describe('nearEdge', () => {
	it('detects points close to the border', () => {
		const r = { left: 0, top: 0, right: 200, bottom: 200 }
		expect(nearEdge({ x: 3, y: 100 }, r)).toBe(true)
		expect(nearEdge({ x: 100, y: 100 }, r)).toBe(false)
	})
})

const parentBox: Candidate = {
	id: 'p',
	rect: { left: 0, top: 0, right: 200, bottom: 200 },
	container: true,
	kids: row,
	axis: 'x',
	parent: null,
}

describe('spotAt', () => {
	it('inserts in a row with a vertical line between items', () => {
		const spot = spotAt(parentBox, { x: 58, y: 50 })
		expect(spot?.parentId).toBe('p')
		expect(spot?.index).toBe(1)
		expect(spot?.line?.left).toBe(60)
		expect(spot?.line?.right).toBe(60)
		expect(spot?.outline).not.toBeNull()
	})
	it('inserts into an empty container without a line', () => {
		const spot = spotAt({ ...parentBox, kids: [] }, { x: 100, y: 100 })
		expect(spot).toMatchObject({ parentId: 'p', index: 0, line: null })
	})
	it('inserts in a column with a horizontal line', () => {
		const spot = spotAt(
			{ ...parentBox, kids: column, axis: 'y' },
			{ x: 50, y: 80 }
		)
		expect(spot?.index).toBe(2)
		expect(spot?.line?.top).toBe(90)
		expect(spot?.line?.bottom).toBe(90)
	})
	it('goes beside a leaf by pointer half', () => {
		const leaf: Candidate = {
			id: 'b',
			rect: column[1].rect,
			container: false,
			kids: [],
			axis: 'y',
			parent: { id: 'p', kids: column, axis: 'y' },
		}
		expect(spotAt(leaf, { x: 50, y: 55 })?.index).toBe(1)
		expect(spotAt(leaf, { x: 50, y: 85 })?.index).toBe(2)
	})
	it('goes beside a container when its edge is hovered', () => {
		const inner: Candidate = {
			...parentBox,
			id: 'b',
			rect: { left: 0, top: 50, right: 100, bottom: 150 },
			kids: [],
			parent: { id: 'p', kids: column, axis: 'y' },
		}
		expect(spotAt(inner, { x: 50, y: 52 })).toMatchObject({
			parentId: 'p',
			index: 1,
		})
		expect(spotAt(inner, { x: 50, y: 100 })).toMatchObject({
			parentId: 'b',
			index: 0,
		})
	})
	it('has no spot for a leaf without a parent', () => {
		expect(
			spotAt({ ...parentBox, container: false }, { x: 1, y: 1 })
		).toBeNull()
	})
})
