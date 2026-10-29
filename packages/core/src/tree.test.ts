import { produce } from 'immer'
import { describe, expect, it } from 'vitest'
import { counterIds } from './ids'
import { parseHtml } from './html'
import {
	addRepeatItem,
	ancestorsOf,
	duplicateNode,
	findElement,
	moveNode,
	removeNode,
	removeRepeatItem,
	repeatItems,
	sectionOf,
	shiftRepeatItem,
	updateElement,
} from './tree'
import type { ElementNode, TreeNode } from './types'

// n1 section, n2 ul, n3 li a, n4 text, n5 li b, n6 text, n7 p, n8 text
const build = () =>
	parseHtml(
		'<section><ul><li data-repeat>a</li><li data-repeat>b</li></ul><p>c</p></section>',
		counterIds()
	).map((node) =>
		node.type === 'element'
			? { ...node, section: { preset: 's', locked: true } }
			: node
	)

const texts = (list: TreeNode[], id: string) =>
	findElement(list, id)!.children.map((li) =>
		li.type === 'element'
			? (li.children[0] as { text: string }).text
			: li.text
	)

describe('tree', () => {
	it('finds elements, ancestors and the section', () => {
		const tree = build()
		expect(findElement(tree, 'n7')?.tag).toBe('p')
		expect(ancestorsOf(tree, 'n4').map((a) => a.id)).toEqual([
			'n1',
			'n2',
			'n3',
		])
		expect(sectionOf(tree, 'n4')?.id).toBe('n1')
	})

	it('moves a node and refuses to move it into itself', () => {
		const tree = produce(build(), (draft) => moveNode(draft, 'n7', 'n2', 0))
		expect(findElement(tree, 'n2')!.children.map((c) => c.id)).toEqual([
			'n7',
			'n3',
			'n5',
		])
		expect(() =>
			produce(build(), (draft) => moveNode(draft, 'n1', 'n2', 0))
		).toThrow(/into itself/)
	})

	it('updates and removes nodes without touching the original', () => {
		const original = build()
		const tree = produce(original, (draft) => {
			updateElement(draft, 'n7', { classes: 'text-lg' })
			removeNode(draft, 'n5')
		})
		expect(findElement(tree, 'n7')!.classes).toBe('text-lg')
		expect(findElement(original, 'n7')!.classes).toBe('')
		expect(findElement(tree, 'n5')).toBeNull()
	})

	it('duplicates with fresh ids', () => {
		const newId = counterIds('x')
		const tree = produce(build(), (draft) => {
			duplicateNode(draft, 'n3', newId)
		})
		const ids = findElement(tree, 'n2')!.children.map((c) => c.id)
		expect(ids).toEqual(['n3', 'x1', 'n5'])
		expect(
			(
				findElement(tree, 'x1')!.children[0] as
					ElementNode | { id: string }
			).id
		).toBe('x2')
	})

	it('adds, removes and reorders repeat items', () => {
		let tree = build()
		expect(repeatItems(tree, 'n3').map((i) => i.id)).toEqual(['n3', 'n5'])
		tree = produce(tree, (draft) => {
			addRepeatItem(draft, 'n5', counterIds('x'))
			shiftRepeatItem(draft, 'n3', 1)
		})
		expect(texts(tree, 'n2')).toEqual(['b', 'a', 'b'])
		tree = produce(tree, (draft) => {
			removeRepeatItem(draft, 'n5')
			removeRepeatItem(draft, 'x1')
		})
		expect(() =>
			produce(tree, (draft) => removeRepeatItem(draft, 'n3'))
		).toThrow(/last item/)
		expect(() =>
			produce(tree, (draft) => {
				addRepeatItem(draft, 'n7', counterIds())
			})
		).toThrow(/Not a repeat item/)
	})
})
