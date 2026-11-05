import { describe, expect, it } from 'vitest'
import { resolveInstance, syncInstances } from './components'
import { parseHtml, serializeHtml } from './html'
import { counterIds } from './ids'
import { isElement, walk } from './tree'
import type { Component, ElementNode, TreeNode } from './types'
import {
	applyClassDiff,
	applyVariant,
	diffClasses,
	isEmptyDiff,
	propKindsFor,
	variantOf,
	visibleHidden,
} from './variants'

const HTML =
	'<div class="bg-white p-4 text-sm"><h2 class="font-bold">Title</h2>' +
	'<p class="mt-2">Hello</p><a href="/a" class="btn">Go</a><img src="a.png" alt="A"></div>'

const make = (): Component => ({
	id: 'c1',
	name: 'Card',
	root: parseHtml(HTML, counterIds('m'))[0] as ElementNode,
})

const find = (root: TreeNode, tag: string) => {
	let found: ElementNode | undefined
	walk([root], (n) => {
		if (!found && isElement(n) && n.tag === tag) found = n
	})
	return found as ElementNode
}

const tokens = (classes: string) => classes.split(' ').sort()

describe('class diffs', () => {
	it('diffs added and removed tokens', () => {
		expect(diffClasses('a b c', 'b c d')).toEqual({
			add: ['d'],
			remove: ['a'],
		})
		expect(isEmptyDiff(diffClasses('a b', 'b  a'))).toBe(true)
	})

	it('applies a diff on top of the base', () => {
		const diff = diffClasses('bg-white p-4 text-sm', 'bg-black p-4 text-sm')
		expect(tokens(applyClassDiff('bg-white p-4 text-sm', diff))).toEqual(
			tokens('bg-black p-4 text-sm')
		)
	})

	it('an unchanged diff returns the base untouched', () => {
		expect(applyClassDiff('a  b', undefined)).toBe('a  b')
		expect(applyClassDiff('a  b', { add: [], remove: [] })).toBe('a  b')
	})

	it('base changes flow through where the variant did not override', () => {
		const diff = diffClasses('p-4 text-sm', 'p-8 text-sm')
		// Base gained a class and changed text size
		const result = applyClassDiff('p-4 text-lg rounded', diff)
		expect(tokens(result)).toEqual(tokens('p-8 text-lg rounded'))
	})

	it('an added token replaces a changed base value of the same group', () => {
		const diff = diffClasses('p-4 md:p-6', 'p-8 md:p-6')
		const result = applyClassDiff('p-2 md:p-6', diff)
		expect(tokens(result)).toEqual(tokens('p-8 md:p-6'))
	})

	it('groups are separate per breakpoint', () => {
		const result = applyClassDiff('p-2 md:p-4', {
			add: ['md:p-8'],
			remove: [],
		})
		expect(tokens(result)).toEqual(tokens('p-2 md:p-8'))
	})

	it('removing a token that is gone from the base is harmless', () => {
		expect(applyClassDiff('a b', { add: [], remove: ['zzz'] })).toBe('a b')
	})

	it('adding a token the base already has does not duplicate it', () => {
		expect(applyClassDiff('a b', { add: ['b'], remove: [] })).toBe('a b')
	})
})

describe('applyVariant', () => {
	it('keeps ids and changes only the listed nodes', () => {
		const { root } = make()
		const h2 = find(root, 'h2')
		const out = applyVariant(root, {
			id: 'v1',
			name: 'Dark',
			diffs: {
				[root.id]: { add: ['bg-black'], remove: ['bg-white'] },
				[h2.id]: { add: ['text-white'], remove: [] },
			},
		})
		expect(out.id).toBe(root.id)
		expect(tokens(out.classes)).toEqual(tokens('bg-black p-4 text-sm'))
		expect(find(out, 'h2').classes).toBe('font-bold text-white')
		expect(find(out, 'p').classes).toBe('mt-2')
		// The master itself is not touched
		expect(root.classes).toBe('bg-white p-4 text-sm')
	})

	it('returns the master for no variant', () => {
		const { root } = make()
		expect(applyVariant(root, undefined)).toBe(root)
	})
})

describe('resolveInstance', () => {
	const withVariant = (): Component => {
		const component = make()
		component.variants = [
			{
				id: 'dark',
				name: 'Dark',
				diffs: {
					[component.root.id]: {
						add: ['bg-black'],
						remove: ['bg-white'],
					},
				},
			},
		]
		return component
	}

	it('builds the base look without a view', () => {
		const component = withVariant()
		const instance = resolveInstance(component, counterIds('i'))
		expect(instance.instance).toEqual({ component: 'c1' })
		expect(instance.classes).toBe('bg-white p-4 text-sm')
	})

	it('builds the variant and records it', () => {
		const component = withVariant()
		const instance = resolveInstance(
			component,
			counterIds('i'),
			undefined,
			undefined,
			{ variant: 'dark' }
		)
		expect(instance.instance?.variant).toBe('dark')
		expect(tokens(instance.classes)).toEqual(tokens('bg-black p-4 text-sm'))
	})

	it('an unknown variant falls back to the base', () => {
		const instance = resolveInstance(
			withVariant(),
			counterIds('i'),
			undefined,
			undefined,
			{ variant: 'gone' }
		)
		expect(instance.instance).toEqual({ component: 'c1' })
		expect(instance.classes).toBe('bg-white p-4 text-sm')
	})

	it('keeps text overrides on any variant', () => {
		const component = withVariant()
		const ids = counterIds('i')
		const base = resolveInstance(component, ids)
		const p = find(base, 'p')
		p.children = [{ id: 'x1', type: 'text', text: 'Mine' }]
		const dark = resolveInstance(component, ids, base, component.root, {
			variant: 'dark',
		})
		expect(serializeHtml(find(dark, 'p').children)).toBe('Mine')
		expect(dark.id).toBe(base.id)
		expect(dark.instance?.variant).toBe('dark')
		expect(find(dark, 'p').id).toBe(p.id)
	})

	it('keeps the previous choice when no view is given', () => {
		const component = withVariant()
		const ids = counterIds('i')
		const first = resolveInstance(component, ids, undefined, undefined, {
			variant: 'dark',
		})
		const again = resolveInstance(component, ids, first, component.root)
		expect(again.instance?.variant).toBe('dark')
		expect(again.classes).toBe(first.classes)
	})

	it('hides nodes that have a visibility property', () => {
		const component = make()
		const a = find(component.root, 'a')
		component.props = [
			{ id: 'p1', label: 'Button', kind: 'visibility', node: a.id },
		]
		const instance = resolveInstance(
			component,
			counterIds('i'),
			undefined,
			undefined,
			{ hidden: [a.id, 'unknown'] }
		)
		expect(instance.instance?.hidden).toEqual([a.id])
		expect(serializeHtml([instance])).not.toContain('<a')
		expect(serializeHtml([instance])).toContain('<h2')
	})

	it('ignores hidden ids without a property', () => {
		const component = make()
		const a = find(component.root, 'a')
		const instance = resolveInstance(
			component,
			counterIds('i'),
			undefined,
			undefined,
			{ hidden: [a.id] }
		)
		expect(instance.instance?.hidden).toBeUndefined()
		expect(serializeHtml([instance])).toContain('<a')
	})

	it('shows a hidden node again when it is unhidden', () => {
		const component = make()
		const a = find(component.root, 'a')
		component.props = [
			{ id: 'p1', label: 'Button', kind: 'visibility', node: a.id },
		]
		const ids = counterIds('i')
		const hidden = resolveInstance(component, ids, undefined, undefined, {
			hidden: [a.id],
		})
		const shown = resolveInstance(component, ids, hidden, component.root, {
			hidden: [],
		})
		expect(serializeHtml([shown])).toContain('<a')
		expect(shown.instance?.hidden).toBeUndefined()
	})
})

describe('syncInstances with variants', () => {
	it('base edits flow into variant instances, overrides survive', () => {
		const component = make()
		component.variants = [
			{
				id: 'dark',
				name: 'Dark',
				diffs: {
					[component.root.id]: {
						add: ['bg-black'],
						remove: ['bg-white'],
					},
				},
			},
		]
		const ids = counterIds('i')
		const instance = resolveInstance(component, ids, undefined, undefined, {
			variant: 'dark',
		})
		find(instance, 'h2').children = [
			{ id: 'x1', type: 'text', text: 'Custom' },
		]
		const oldMaster = component.root
		// Base gets a new padding and a new heading class
		const next: Component = {
			...component,
			root: {
				...oldMaster,
				classes: 'bg-white p-8 text-sm',
				children: oldMaster.children.map((c) =>
					isElement(c) && c.tag === 'h2'
						? { ...c, classes: 'font-bold underline' }
						: c
				),
			},
		}
		const lists: TreeNode[][] = [[instance]]
		syncInstances(lists, next, oldMaster, ids)
		const out = lists[0][0] as ElementNode
		expect(tokens(out.classes)).toEqual(tokens('bg-black p-8 text-sm'))
		expect(find(out, 'h2').classes).toBe('font-bold underline')
		expect(serializeHtml(find(out, 'h2').children)).toBe('Custom')
		expect(out.instance?.variant).toBe('dark')
	})

	it('a deleted variant falls back to the base', () => {
		const component = make()
		component.variants = [
			{
				id: 'dark',
				name: 'Dark',
				diffs: { [component.root.id]: { add: ['x'], remove: [] } },
			},
		]
		const ids = counterIds('i')
		const instance = resolveInstance(component, ids, undefined, undefined, {
			variant: 'dark',
		})
		const lists: TreeNode[][] = [[instance]]
		const next = { ...component, variants: [] }
		syncInstances(lists, next, component.root, ids)
		const out = lists[0][0] as ElementNode
		expect(out.instance).toEqual({ component: 'c1' })
		expect(out.classes).toBe('bg-white p-4 text-sm')
	})
})

describe('helpers', () => {
	it('finds a variant', () => {
		const c = { variants: [{ id: 'a', name: 'A', diffs: {} }] }
		expect(variantOf(c, 'a')?.name).toBe('A')
		expect(variantOf(c, 'b')).toBeUndefined()
		expect(variantOf({}, undefined)).toBeUndefined()
	})

	it('lists property kinds per node', () => {
		const { root } = make()
		expect(propKindsFor(root, true)).toEqual([])
		expect(propKindsFor(find(root, 'h2'))).toEqual(['text', 'visibility'])
		expect(propKindsFor(find(root, 'a'))).toEqual([
			'link',
			'text',
			'visibility',
		])
		expect(propKindsFor(find(root, 'img'))).toEqual(['image', 'visibility'])
	})

	it('keeps only hidden ids with a visibility property', () => {
		const props = [
			{ id: 'p', label: 'A', kind: 'visibility' as const, node: 'n1' },
			{ id: 'q', label: 'B', kind: 'text' as const, node: 'n2' },
		]
		expect(visibleHidden({ props }, ['n1', 'n2', 'n3'])).toEqual(['n1'])
		expect(visibleHidden({}, ['n1'])).toEqual([])
	})
})
