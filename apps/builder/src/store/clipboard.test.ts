import { describe, expect, it } from 'vitest'
import { counterIds, type ElementNode } from '@ui-system/core'
import {
	flattenUnknown,
	freshCopy,
	parseClip,
	resolvePaste,
	serializeClip,
} from './clipboard'

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

describe('clipboard payload', () => {
	it('round-trips nodes', () => {
		const nodes = [el('a', 'div')]
		const clip = parseClip(serializeClip('element', nodes))
		expect(clip).toEqual({ uiBuilder: 1, kind: 'element', nodes })
	})

	it('rejects foreign or broken text', () => {
		expect(parseClip('hello')).toBeNull()
		expect(parseClip('{"a":1}')).toBeNull()
		expect(parseClip('{broken')).toBeNull()
		expect(parseClip(null)).toBeNull()
		expect(
			parseClip('{"uiBuilder":1,"kind":"section","nodes":[]}')
		).toBeNull()
		expect(
			parseClip('{"uiBuilder":1,"kind":"x","nodes":[{"id":"a"}]}')
		).toBeNull()
		expect(
			parseClip('{"uiBuilder":1,"kind":"element","nodes":[{"id":"a"}]}')
		).toBeNull()
	})
})

describe('freshCopy', () => {
	it('gives new ids and unique html ids', () => {
		const nodes = [el('a', 'div', [], { attrs: { id: 'x' } })]
		const [copy] = freshCopy(nodes, counterIds('n'), () => true)
		expect(copy.id).toMatch(/^n/)
		expect(copy.id).not.toBe('a')
		expect(copy.attrs.id).toMatch(/^x-/)
		expect(nodes[0].id).toBe('a')
	})

	it('flattens instances of unknown components only', () => {
		const inst = (id: string, component: string) =>
			el(
				id,
				'div',
				[el(`${id}c`, 'p', [text('t')], { ref: 'm', slot: 'text' })],
				{ instance: { component } }
			)
		const out = flattenUnknown(
			[el('box', 'div', [inst('i1', 'known'), inst('i2', 'gone')])],
			(id) => id === 'known'
		)
		const [i1, i2] = out[0].children as ElementNode[]
		expect(i1.instance).toBeTruthy()
		expect(i2.instance).toBeUndefined()
		expect((i2.children[0] as ElementNode).ref).toBeUndefined()
	})
})

// hd: header, free: unlocked section with a box and an empty box
// lock: locked section with a slot
const roots = (): ElementNode[] => [
	el('hd', 'header', [], { section: { preset: 'h', locked: false } }),
	el(
		'free',
		'section',
		[el('box', 'div', [el('p', 'p', [text('t')])]), el('empty', 'div')],
		{
			section: { preset: 'x', locked: false },
		}
	),
	el('lock', 'section', [el('slot', 'h2', [text('t2')], { slot: 'text' })], {
		section: { preset: 'y', locked: true },
	}),
]

const where = (selectedId: string | null, editing = false) => {
	const r = roots()
	return {
		roots: r,
		sections: r.slice(1),
		selectedId,
		headerId: 'hd',
		footerId: null,
		editing,
	}
}

describe('resolvePaste', () => {
	it('puts a section after the selected one, or at the end', () => {
		expect(resolvePaste('section', where('free'))).toEqual({
			kind: 'section',
			index: 1,
		})
		expect(resolvePaste('section', where('p'))).toEqual({
			kind: 'section',
			index: 1,
		})
		expect(resolvePaste('section', where(null))).toEqual({
			kind: 'section',
			index: 2,
		})
		expect(resolvePaste('section', where('hd'))).toEqual({
			kind: 'section',
			index: 0,
		})
		expect(resolvePaste('section', where('free', true))).toEqual({
			blocked: 'editing',
		})
	})

	it('puts an element after the selected one', () => {
		expect(resolvePaste('element', where('p'))).toEqual({
			kind: 'element',
			parentId: 'box',
			index: 1,
		})
	})

	it('puts an element inside a section root or an empty container', () => {
		expect(resolvePaste('element', where('free'))).toEqual({
			kind: 'element',
			parentId: 'free',
			index: 2,
		})
		expect(resolvePaste('element', where('empty'))).toEqual({
			kind: 'element',
			parentId: 'empty',
			index: 0,
		})
	})

	it('refuses locked areas and no selection', () => {
		expect(resolvePaste('element', where('slot'))).toEqual({
			blocked: 'locked',
		})
		expect(resolvePaste('element', where('lock'))).toEqual({
			blocked: 'locked',
		})
		expect(resolvePaste('element', where(null))).toEqual({
			blocked: 'select',
		})
	})
})
