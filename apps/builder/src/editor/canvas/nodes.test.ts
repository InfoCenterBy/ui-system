import { describe, expect, it } from 'vitest'
import { walk, type ElementNode } from '@ui-system/core'
import { insertPlace } from '@/editor/navigator/insertTarget'
import {
	canContain,
	flattenComponent,
	flattenVisible,
} from '@/editor/navigator/structure'
import { inlineKindOf, pickTarget, scopeOf } from './nodes'

const el = (
	id: string,
	tag: string,
	children: ElementNode['children'] = [],
	extra: Partial<ElementNode> = {}
): ElementNode => ({
	id,
	type: 'element',
	tag,
	classes: '',
	attrs: {},
	children,
	...extra,
})

const text = (id: string): ElementNode['children'][number] => ({
	id,
	type: 'text',
	text: 'Hi',
})

// free: unlocked section with a box, a paragraph and a card instance
// locked: locked section with a slot
// top: section instance at the top level
const page = (): ElementNode[] => [
	el(
		'free',
		'section',
		[
			el('box', 'div', [el('plain', 'p', [text('t1')])]),
			el(
				'card',
				'div',
				[
					el('cbody', 'div', [
						el('ctitle', 'h2', [text('t2')], { slot: 'rich' }),
					]),
				],
				{ instance: { component: 'c1' } }
			),
		],
		{ section: { preset: 'x', locked: false } }
	),
	el(
		'locked',
		'section',
		[
			el('lbox', 'div', [
				el('lslot', 'h2', [text('t3')], { slot: 'text' }),
			]),
		],
		{ section: { preset: 'x', locked: true } }
	),
	el(
		'top',
		'section',
		[el('tbody', 'div', [el('tslot', 'p', [], { slot: 'rich' })])],
		{
			section: { preset: 'x', locked: true },
			instance: { component: 'c2' },
		}
	),
]

const get = (roots: ElementNode[], id: string) => {
	let found: ElementNode | null = null
	walk(roots, (n) => {
		if (n.type === 'element' && n.id === id) found = n
	})
	return found as unknown as ElementNode
}

describe('scopeOf', () => {
	it('is free in unlocked sections', () => {
		const roots = page()
		expect(scopeOf(roots, 'free')).toBe('free')
		expect(scopeOf(roots, 'box')).toBe('free')
		expect(scopeOf(roots, 'plain')).toBe('free')
	})
	it('is slots only in locked sections and inside instances', () => {
		const roots = page()
		expect(scopeOf(roots, 'locked')).toBe('slots')
		expect(scopeOf(roots, 'lbox')).toBe('slots')
		expect(scopeOf(roots, 'cbody')).toBe('slots')
		expect(scopeOf(roots, 'ctitle')).toBe('slots')
		expect(scopeOf(roots, 'tbody')).toBe('slots')
		expect(scopeOf(roots, 'nope')).toBe('slots')
	})
	it('puts an instance root in the scope of its container', () => {
		const roots = page()
		expect(scopeOf(roots, 'card')).toBe('free')
		expect(scopeOf(roots, 'top')).toBe('free')
	})
	it('is free in the master while a component is edited', () => {
		const master = el('m', 'div', [el('mi', 'span')])
		expect(scopeOf([master], 'm', true)).toBe('free')
		expect(scopeOf([master], 'mi', true)).toBe('free')
		expect(scopeOf([master], 'mi')).toBe('slots')
		const section = el('ms', 'section', [el('mi', 'span')], {
			section: { preset: 'x', locked: false },
		})
		expect(scopeOf([section], 'mi', true)).toBe('free')
	})
})

describe('pickTarget', () => {
	it('picks any element in free scope', () => {
		expect(pickTarget(page(), 'plain')).toBe('plain')
	})
	it('picks slots, sections and instance roots elsewhere', () => {
		const roots = page()
		expect(pickTarget(roots, 'lbox')).toBe('locked')
		expect(pickTarget(roots, 'lslot')).toBe('lslot')
		expect(pickTarget(roots, 'cbody')).toBe('card')
		expect(pickTarget(roots, 'ctitle')).toBe('ctitle')
		expect(pickTarget(roots, 'tbody')).toBe('top')
		expect(pickTarget(roots, null)).toBeNull()
	})
})

describe('inlineKindOf', () => {
	it('edits slots by kind and free text-like elements as rich', () => {
		const roots = page()
		expect(inlineKindOf(roots, get(roots, 'ctitle'))).toBe('rich')
		expect(inlineKindOf(roots, get(roots, 'lslot'))).toBe('text')
		expect(inlineKindOf(roots, get(roots, 'plain'))).toBe('rich')
		expect(inlineKindOf(roots, get(roots, 'box'))).toBeNull()
		expect(inlineKindOf(roots, get(roots, 'cbody'))).toBeNull()
	})
})

describe('insertPlace with instances', () => {
	it('is null for anything inside an instance', () => {
		const roots = page()
		expect(insertPlace(roots, 'cbody')).toBeNull()
		expect(insertPlace(roots, 'ctitle')).toBeNull()
		expect(insertPlace(roots, 'tbody')).toBeNull()
		expect(insertPlace(roots, 'lbox')).toBeNull()
	})
	it('goes after an instance, never into it', () => {
		const roots = page()
		expect(insertPlace(roots, 'card')).toEqual({
			parentId: 'free',
			index: 2,
		})
		expect(insertPlace(roots, 'top')).toBeNull()
		expect(canContain(get(roots, 'card'))).toBe(false)
	})
	it('works in the master while editing', () => {
		const master = el('m', 'div', [el('mi', 'span')])
		expect(insertPlace([master], 'm', true)).toEqual({
			parentId: 'm',
			index: 1,
		})
		expect(insertPlace([master], 'm')).toBeNull()
	})
})

describe('navigator rows with instances', () => {
	it('shows an instance as one row', () => {
		const open = { free: true, box: true, card: true, top: true }
		const rows = flattenVisible(page(), open).map((r) => r.node.id)
		expect(rows).toEqual(['free', 'box', 'plain', 'card', 'locked', 'top'])
	})
	it('lists a master from its root', () => {
		const master = el('m', 'div', [el('mi', 'span')])
		expect(flattenComponent(master, {}).map((r) => r.node.id)).toEqual([
			'm',
		])
		const rows = flattenComponent(master, { m: true })
		expect(rows.map((r) => [r.node.id, r.depth])).toEqual([
			['m', 0],
			['mi', 1],
		])
	})
})
