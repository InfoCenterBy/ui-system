import { describe, expect, it } from 'vitest'
import { parseHtml, type ElementNode } from '@ui-system/core'
import { ELEMENT_PRESETS } from './elementPresets'
import { insertPlace } from './insertTarget'
import { canContain, flattenVisible } from './structure'

let n = 0
const ids = () => `n${++n}`

describe('element presets', () => {
	it.each(ELEMENT_PRESETS)('$label parses to one element', ({ html }) => {
		const nodes = parseHtml(html, ids)
		expect(nodes).toHaveLength(1)
		expect(nodes[0].type).toBe('element')
	})
})

const el = (
	id: string,
	tag: string,
	children: ElementNode['children'] = [],
	section?: ElementNode['section']
): ElementNode => ({
	id,
	type: 'element',
	tag,
	classes: '',
	attrs: {},
	children,
	section,
})

const tree = (locked: boolean) => [
	el(
		's',
		'section',
		[
			el('d', 'div', [
				el('h', 'h2', [{ id: 'x', type: 'text', text: 'Hi' }]),
			]),
			el('i', 'img'),
		],
		{ preset: 'p', locked }
	),
]

describe('insertPlace', () => {
	it('appends into containers and the section root', () => {
		expect(insertPlace(tree(false), 'd')).toEqual({
			parentId: 'd',
			index: 1,
		})
		expect(insertPlace(tree(false), 's')).toEqual({
			parentId: 's',
			index: 2,
		})
	})
	it('goes after leaves', () => {
		expect(insertPlace(tree(false), 'h')).toEqual({
			parentId: 'd',
			index: 1,
		})
		expect(insertPlace(tree(false), 'i')).toEqual({
			parentId: 's',
			index: 2,
		})
	})
	it('is null for locked sections or no selection', () => {
		expect(insertPlace(tree(true), 'd')).toBeNull()
		expect(insertPlace(tree(false), null)).toBeNull()
	})
})

describe('structure', () => {
	it('knows what can contain children', () => {
		const [s] = tree(false)
		expect(canContain(s)).toBe(true)
		expect(canContain(el('i', 'img'))).toBe(false)
		expect(canContain(el('p', 'p'))).toBe(false)
	})
	it('lists rows of open unlocked sections only', () => {
		expect(flattenVisible(tree(false), {}).map((r) => r.node.id)).toEqual([
			's',
		])
		expect(
			flattenVisible(tree(false), { s: true, d: true }).map(
				(r) => r.node.id
			)
		).toEqual(['s', 'd', 'h', 'i'])
		expect(flattenVisible(tree(true), { s: true })).toHaveLength(1)
	})
})
