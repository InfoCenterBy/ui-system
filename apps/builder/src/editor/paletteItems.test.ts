import { describe, expect, it } from 'vitest'
import {
	filterItems,
	type PaletteItem,
	type PaletteGroup,
} from './paletteItems'

const item = (
	id: string,
	group: PaletteGroup,
	label: string,
	hint?: string
): PaletteItem => ({ id, group, label, hint, run: () => {} })

const items = [
	item('p1', 'page', 'Home'),
	item('s1', 'section', 'Hero centered', 'Hero'),
	item('s2', 'section', 'Pricing table', 'Pricing'),
	item('e1', 'element', 'Button', 'Actions'),
	item('a1', 'action', 'Undo'),
]

describe('filterItems', () => {
	it('lists everything in group order without a query', () => {
		expect(filterItems(items, '').map((i) => i.id)).toEqual([
			'a1',
			'p1',
			's1',
			's2',
			'e1',
		])
	})

	it('matches every word in label or hint, ignoring case', () => {
		expect(filterItems(items, 'HERO cen').map((i) => i.id)).toEqual(['s1'])
		expect(filterItems(items, 'actions').map((i) => i.id)).toEqual(['e1'])
		expect(filterItems(items, 'nothing')).toEqual([])
	})

	it('caps each group', () => {
		const many = Array.from({ length: 30 }, (_, n) =>
			item(`s${n}`, 'section', `Section ${n}`)
		)
		expect(filterItems(many, '', 5)).toHaveLength(5)
		expect(filterItems(many, 'section', 5)).toHaveLength(10)
	})
})
