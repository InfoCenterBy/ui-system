import { describe, expect, it } from 'vitest'
import type { ElementCategory } from '@ui-system/blocks'
import { EMPTY_HINT_LABELS, LAYOUT_COMPONENTS } from '@/editor/layoutPresets'
import { BUILDER_GROUP, groupElements } from '@/editor/panels/elementGroups'

const variant = (id: string, title: string) => ({
	id,
	name: title,
	title,
	html: '<div></div>',
})
const categories: ElementCategory[] = [
	{
		slug: 'accordion',
		name: 'Accordion',
		group: 'data-display',
		variants: [
			variant('accordion/a', 'Basic'),
			variant('accordion/b', 'Icon'),
		],
	},
	{
		slug: 'button',
		name: 'Button',
		group: 'actions',
		variants: [variant('button/a', 'Outline')],
	},
]
const groups = [
	{ id: 'actions', name: 'Actions' },
	{ id: 'data-display', name: 'Data display' },
	{ id: 'layout', name: 'Layout' },
] as const

describe('groupElements', () => {
	it('puts builder layout first and drops empty groups', () => {
		const result = groupElements([...groups], categories, '')
		expect(result.map((g) => g.id)).toEqual([
			BUILDER_GROUP,
			'actions',
			'data-display',
		])
	})

	it('keeps all variants when the component name matches', () => {
		const result = groupElements([...groups], categories, 'accord')
		expect(result).toHaveLength(1)
		expect(result[0]?.entries[0]?.variants).toHaveLength(2)
	})

	it('keeps only matching variants when a title matches', () => {
		const result = groupElements([...groups], categories, 'icon')
		expect(result[0]?.entries[0]?.variants.map((v) => v.title)).toEqual([
			'Icon',
		])
	})

	it('returns nothing for unknown text', () => {
		expect(groupElements([...groups], categories, 'zzz')).toEqual([])
	})
})

describe('layout presets', () => {
	it('label every html with a hint label', () => {
		for (const c of LAYOUT_COMPONENTS) {
			for (const v of c.variants) {
				expect(v.html).toContain(`data-label="${c.name}"`)
			}
		}
		expect(EMPTY_HINT_LABELS).toContain('Content')
	})
})
