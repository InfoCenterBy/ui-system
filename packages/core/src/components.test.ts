import { produce } from 'immer'
import { describe, expect, it } from 'vitest'
import {
	createComponent,
	detachInstance,
	hasInstance,
	instancesOf,
	isOverridden,
	materialize,
	resetOverride,
	syncInstances,
} from './components'
import { parseHtml, serializeHtml } from './html'
import { counterIds } from './ids'
import { isElement, walk } from './tree'
import type { Component, ElementNode, TreeNode } from './types'

const HTML =
	'<div class="p-4"><h2>Title</h2><ul><li data-repeat><a class="btn" href="/a">One</a></li></ul>' +
	'<img src="a.png" alt="A"><p>Hello <strong>you</strong></p></div>'

const master = (html = HTML) =>
	parseHtml(html, counterIds('m'))[0] as ElementNode

const all = (root: TreeNode) => {
	const nodes: TreeNode[] = []
	walk([root], (n) => {
		nodes.push(n)
	})
	return nodes
}

const byTag = (root: ElementNode, tag: string) =>
	all(root).find((n) => isElement(n) && n.tag === tag) as ElementNode

const textOf = (node: ElementNode) => serializeHtml(node.children)

describe('createComponent', () => {
	it('clones the master and keeps the page root id', () => {
		const page = parseHtml(HTML, counterIds('p'))[0] as ElementNode
		const { component, instance } = createComponent(
			page,
			'c1',
			'Card',
			counterIds('x')
		)
		expect(instance.id).toBe(page.id)
		expect(instance.instance).toEqual({ component: 'c1' })
		expect(component.root.id).not.toBe(page.id)
		expect(
			all(component.root).some((n) => 'ref' in n || 'instance' in n)
		).toBe(false)
		expect(instance.ref).toBe(component.root.id)
	})

	it('throws when the node holds an instance', () => {
		const { instance } = createComponent(
			master(),
			'c1',
			'A',
			counterIds('x')
		)
		const wrapper = parseHtml('<section><div></div></section>')[0]
		;(wrapper as ElementNode).children.push(instance)
		expect(() =>
			createComponent(wrapper as ElementNode, 'c2', 'B', counterIds('y'))
		).toThrow()
		expect(hasInstance(wrapper)).toBe(true)
	})
})

describe('materialize', () => {
	it('assigns refs, slots and drops repeat', () => {
		const m = master()
		const inst = materialize(m, 'c1', counterIds('i'))
		expect(inst.instance).toEqual({ component: 'c1' })
		for (const n of all(inst)) expect(n.ref).toBeTruthy()
		expect(byTag(inst, 'h2').slot).toBe('rich')
		expect(byTag(inst, 'a').slot).toBe('link')
		expect(byTag(inst, 'img').slot).toBe('image')
		expect(byTag(inst, 'strong').slot).toBeUndefined()
		expect(byTag(inst, 'li').repeat).toBeUndefined()
		expect(byTag(inst, 'li').slot).toBeUndefined()
		expect(inst.slot).toBeUndefined()
		const ids = all(inst).map((n) => n.id)
		expect(new Set(ids).size).toBe(ids.length)
		expect(ids.some((id) => id.startsWith('m'))).toBe(false)
	})

	it('keeps master slots and locks the section on the root', () => {
		const m = master(
			'<section data-edit="text"><span data-edit="text">x</span></section>'
		)
		m.section = { preset: 'p', locked: false }
		const inst = materialize(m, 'c1', counterIds('i'))
		expect(inst.section).toEqual({ preset: 'p', locked: true })
		expect((inst.children[0] as ElementNode).section).toBeUndefined()
		expect((inst.children[0] as ElementNode).slot).toBe('text')
	})

	it('keeps overrides and follows the master for the rest', () => {
		const m = master()
		const ids = counterIds('i')
		const inst = materialize(m, 'c1', ids)
		byTag(inst, 'h2').children = [{ id: 'own', type: 'text', text: 'Mine' }]
		byTag(inst, 'img').attrs.alt = 'Mine'

		const next = produce(m, (draft) => {
			;(byTag(draft, 'h2').children[0] as { text: string }).text =
				'New title'
			;(byTag(draft, 'p').children[0] as { text: string }).text = 'Bye '
		})
		const again = materialize(next, 'c1', ids, inst, m)
		expect(textOf(byTag(again, 'h2'))).toBe('Mine')
		expect(again.id).toBe(inst.id)
		expect(byTag(again, 'h2').id).toBe(byTag(inst, 'h2').id)
		expect(byTag(again, 'img').attrs.alt).toBe('Mine')
		expect(byTag(again, 'img').attrs.src).toBe('a.png')
		expect(textOf(byTag(again, 'p'))).toBe('Bye <strong>you</strong>')
		expect(isOverridden(byTag(again, 'h2'), next)).toBe(true)
		expect(isOverridden(byTag(again, 'p'), next)).toBe(false)
	})

	it('treats content differing from the new master as override without old master', () => {
		const m = master()
		const ids = counterIds('i')
		const inst = materialize(m, 'c1', ids)
		byTag(inst, 'a').attrs.href = '/mine'
		const again = materialize(m, 'c1', ids, inst)
		expect(byTag(again, 'a').attrs.href).toBe('/mine')
	})

	it('propagates structure changes and keeps surviving overrides', () => {
		const m = master()
		const ids = counterIds('i')
		const inst = materialize(m, 'c1', ids)
		byTag(inst, 'a').attrs.href = '/mine'
		const imgId = byTag(inst, 'img').id

		const next = produce(m, (draft) => {
			draft.classes = 'p-8'
			// Removed element and added element
			draft.children = draft.children.filter(
				(c) => !(isElement(c) && c.tag === 'h2')
			)
			draft.children.push(...parseHtml('<h3>Added</h3>', counterIds('z')))
		})
		const again = materialize(next, 'c1', ids, inst, m)
		expect(again.classes).toBe('p-8')
		expect(all(again).some((n) => isElement(n) && n.tag === 'h2')).toBe(
			false
		)
		const added = byTag(again, 'h3')
		expect(textOf(added)).toBe('Added')
		expect(added.slot).toBe('rich')
		expect(byTag(again, 'a').attrs.href).toBe('/mine')
		expect(byTag(again, 'img').id).toBe(imgId)
	})
})

describe('resetOverride', () => {
	it('restores attrs and children from the master', () => {
		const m = master()
		const ids = counterIds('i')
		const inst = materialize(m, 'c1', ids)
		const h2 = byTag(inst, 'h2')
		h2.children = [{ id: 'own', type: 'text', text: 'Mine' }]
		const img = byTag(inst, 'img')
		img.attrs.src = 'b.png'
		expect(isOverridden(h2, m)).toBe(true)
		resetOverride(h2, m, ids)
		resetOverride(img, m, ids)
		expect(textOf(h2)).toBe('Title')
		expect(h2.children[0].ref).toBe(byTag(m, 'h2').children[0].id)
		expect(h2.children[0].id).not.toBe('own')
		expect(img.attrs.src).toBe('a.png')
		expect(isOverridden(h2, m)).toBe(false)
		expect(isOverridden(img, m)).toBe(false)
	})
})

describe('detachInstance', () => {
	it('returns a plain tree with master markers', () => {
		const m = parseHtml(
			'<ul data-repeat="x"><li>a</li></ul>',
			counterIds('m')
		)[0] as ElementNode
		m.section = { preset: 'p', locked: true }
		const inst = materialize(m, 'c1', counterIds('i'))
		const plain = detachInstance(inst, m)
		expect(plain.id).toBe(inst.id)
		expect(plain.instance).toBeUndefined()
		expect(plain.repeat).toBe('x')
		expect(plain.section).toEqual({ preset: 'p', locked: false })
		expect(byTag(plain, 'li').slot).toBeUndefined()
		for (const n of all(plain)) expect('ref' in n).toBe(false)
		// The instance itself is untouched
		expect(inst.instance).toBeTruthy()
	})

	it('drops slots without a master', () => {
		const inst = materialize(master(), 'c1', counterIds('i'))
		const plain = detachInstance(inst)
		expect(all(plain).some((n) => isElement(n) && n.slot)).toBe(false)
		expect(all(plain).some((n) => 'ref' in n)).toBe(false)
	})
})

describe('syncInstances', () => {
	it('rebuilds instances on several pages, also on drafts', () => {
		const m = master()
		const ids = counterIds('i')
		const a = materialize(m, 'c1', ids)
		const b = materialize(m, 'c1', ids)
		byTag(b, 'h2').children = [{ id: 'own', type: 'text', text: 'Mine' }]
		const other = parseHtml('<section><p>x</p></section>', ids)[0]
		const pageA: TreeNode[] = [a]
		const pageB: TreeNode[] = [
			{
				...(other as ElementNode),
				children: [...(other as ElementNode).children, b],
			},
		]
		expect(instancesOf([pageA, pageB], 'c1')).toHaveLength(2)

		const next: Component = {
			id: 'c1',
			name: 'Card',
			root: produce(m, (d) => {
				d.classes = 'p-9'
			}),
		}
		let count = 0
		const synced = produce({ pageA, pageB }, (draft) => {
			count = syncInstances([draft.pageA, draft.pageB], next, m, ids)
		})
		expect(count).toBe(2)
		expect((synced.pageA[0] as ElementNode).classes).toBe('p-9')
		expect(synced.pageA[0].id).toBe(a.id)
		const nested = instancesOf([synced.pageB], 'c1')[0]
		expect(nested.classes).toBe('p-9')
		expect(textOf(byTag(nested, 'h2'))).toBe('Mine')
	})
})

describe('serialize', () => {
	it('outputs no markers for an instance', () => {
		const m = master()
		const inst = materialize(m, 'c1', counterIds('i'))
		expect(serializeHtml([inst])).toBe(serializeHtml([m]))
		expect(serializeHtml([inst], { markers: true })).not.toMatch(
			/instance|\sref=/
		)
	})
})

describe('labels', () => {
	it('survive materialize and detach', () => {
		const m = master('<div data-label="Card"><p>x</p></div>')
		const inst = materialize(m, 'c', counterIds('i'))
		expect(inst.label).toBe('Card')
		expect(detachInstance(inst, m).label).toBe('Card')
	})
})
