import { describe, expect, it } from 'vitest'
import type { SectionPreset } from '@ui-system/core'
import type { SectionCategory } from '@ui-system/blocks/sections'
import { groupSections, parseOpenIds } from '@/editor/panels/sectionGroups'

const categories: SectionCategory[] = [
	{ id: 'hero', name: 'Hero' },
	{ id: 'faq', name: 'FAQ' },
	{ id: 'empty', name: 'Empty' },
]
const preset = (id: string, category: string): SectionPreset => ({
	id,
	name: id,
	category,
	html: '',
})
const presets = [
	preset('Hero centered', 'hero'),
	preset('Hero split', 'hero'),
	preset('Accordion', 'faq'),
]

describe('groupSections', () => {
	it('drops empty categories without a query', () => {
		const groups = groupSections(categories, presets, '')
		expect(groups.map((g) => g.category.id)).toEqual(['hero', 'faq'])
		expect(groups[0]?.presets).toHaveLength(2)
	})

	it('matches preset names case-insensitively', () => {
		const groups = groupSections(categories, presets, ' SPLIT ')
		expect(groups).toHaveLength(1)
		expect(groups[0]?.presets.map((p) => p.id)).toEqual(['Hero split'])
	})

	it('matches the category name', () => {
		const groups = groupSections(categories, presets, 'faq')
		expect(groups.map((g) => g.category.id)).toEqual(['faq'])
	})

	it('returns nothing when nothing matches', () => {
		expect(groupSections(categories, presets, 'zzz')).toEqual([])
	})
})

describe('parseOpenIds', () => {
	it('parses a string array', () => {
		expect(parseOpenIds('["hero","faq"]')).toEqual(['hero', 'faq'])
	})

	it('handles missing and broken data', () => {
		expect(parseOpenIds(null)).toEqual([])
		expect(parseOpenIds('{oops')).toEqual([])
		expect(parseOpenIds('{"a":1}')).toEqual([])
	})

	it('skips non-string items', () => {
		expect(parseOpenIds('["hero",1,null]')).toEqual(['hero'])
	})
})
