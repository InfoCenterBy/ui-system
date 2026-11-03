import type { ElementNode, NodeId, TreeNode } from './types'
import { isElement, locate, repeatItems } from './tree'

// Repeat item that holds a node and the child-index path from the item root to it
export const repeatPath = (list: TreeNode[], id: NodeId) => {
	let current = id
	const path: number[] = []
	for (;;) {
		const at = locate(list, current)
		if (!at) return null
		const node = at.list[at.index]
		if (isElement(node) && node.repeat) {
			return repeatItems(list, node.id).length > 1
				? { item: node, path }
				: null
		}
		if (!at.parent) return null
		path.unshift(at.index)
		current = at.parent.id
	}
}

const follow = (root: ElementNode, path: number[]) => {
	let node: ElementNode = root
	for (const index of path) {
		const child: TreeNode | undefined = node.children[index]
		if (!isElement(child)) return null
		node = child
	}
	return node
}

// Copies a node's classes to the same place in every other item of its repeat group, returns how many changed
export const applyClassesToItems = (list: TreeNode[], id: NodeId) => {
	const found = repeatPath(list, id)
	const source = found && follow(found.item, found.path)
	if (!found || !source) return 0
	let count = 0
	for (const item of repeatItems(list, found.item.id)) {
		if (item.id === found.item.id) continue
		const target = follow(item, found.path)
		if (!target) continue
		target.classes = source.classes
		count++
	}
	return count
}
