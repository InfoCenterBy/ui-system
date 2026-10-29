import type { IdFactory } from './ids'
import type { ElementNode, NodeId, TreeNode } from './types'

// Mutating helpers, meant to run on Immer drafts or on fresh copies

export interface Location {
	parent: ElementNode | null
	list: TreeNode[]
	index: number
}

export const isElement = (
	node: TreeNode | null | undefined
): node is ElementNode => node?.type === 'element'

// Depth-first visit, return false from the callback to skip a subtree
export const walk = (
	list: TreeNode[],
	visit: (node: TreeNode, parent: ElementNode | null) => boolean | void,
	parent: ElementNode | null = null
) => {
	for (const node of list) {
		if (visit(node, parent) === false) continue
		if (isElement(node)) walk(node.children, visit, node)
	}
}

export const locate = (
	list: TreeNode[],
	id: NodeId,
	parent: ElementNode | null = null
): Location | null => {
	for (let index = 0; index < list.length; index++) {
		const node = list[index]
		if (node.id === id) return { parent, list, index }
		if (isElement(node)) {
			const found = locate(node.children, id, node)
			if (found) return found
		}
	}
	return null
}

export const findNode = (list: TreeNode[], id: NodeId): TreeNode | null => {
	const at = locate(list, id)
	return at ? at.list[at.index] : null
}

export const findElement = (list: TreeNode[], id: NodeId) => {
	const node = findNode(list, id)
	return isElement(node) ? node : null
}

// Ancestors from the root down to the direct parent
export const ancestorsOf = (list: TreeNode[], id: NodeId): ElementNode[] => {
	const path: ElementNode[] = []
	const search = (nodes: TreeNode[]): boolean => {
		for (const node of nodes) {
			if (node.id === id) return true
			if (isElement(node)) {
				path.push(node)
				if (search(node.children)) return true
				path.pop()
			}
		}
		return false
	}
	return search(list) ? path : []
}

export const sectionOf = (list: TreeNode[], id: NodeId) => {
	const node = findElement(list, id)
	if (node?.section) return node
	return ancestorsOf(list, id).findLast((el) => el.section) ?? null
}

const childList = (list: TreeNode[], parentId: NodeId | null) => {
	if (parentId === null) return list
	const parent = findElement(list, parentId)
	if (!parent) throw new Error(`No element with id ${parentId}`)
	return parent.children
}

export const insertNode = (
	list: TreeNode[],
	parentId: NodeId | null,
	index: number,
	node: TreeNode
) => {
	const target = childList(list, parentId)
	target.splice(Math.max(0, Math.min(index, target.length)), 0, node)
}

export const removeNode = (list: TreeNode[], id: NodeId) => {
	const at = locate(list, id)
	if (!at) throw new Error(`No node with id ${id}`)
	return at.list.splice(at.index, 1)[0]
}

// Index is counted in the target list after the node is taken out
export const moveNode = (
	list: TreeNode[],
	id: NodeId,
	parentId: NodeId | null,
	index: number
) => {
	if (
		parentId === id ||
		(parentId && ancestorsOf(list, parentId).some((a) => a.id === id))
	) {
		throw new Error('A node cannot move into itself')
	}
	const node = removeNode(list, id)
	insertNode(list, parentId, index, node)
}

export type ElementPatch = Partial<
	Pick<
		ElementNode,
		'tag' | 'classes' | 'attrs' | 'slot' | 'repeat' | 'section'
	>
>

export const updateElement = (
	list: TreeNode[],
	id: NodeId,
	patch: ElementPatch
) => {
	const node = findElement(list, id)
	if (!node) throw new Error(`No element with id ${id}`)
	Object.assign(node, patch)
}

export const replaceChildren = (
	list: TreeNode[],
	id: NodeId,
	children: TreeNode[]
) => {
	const node = findElement(list, id)
	if (!node) throw new Error(`No element with id ${id}`)
	node.children = children
}

// Deep copy with fresh ids everywhere
export const cloneNode = <T extends TreeNode>(node: T, newId: IdFactory): T => {
	if (!isElement(node)) return { ...node, id: newId() }
	return {
		...node,
		id: newId(),
		attrs: { ...node.attrs },
		section: node.section && { ...node.section },
		children: node.children.map((child) => cloneNode(child, newId)),
	} as T
}

export const duplicateNode = (
	list: TreeNode[],
	id: NodeId,
	newId: IdFactory
) => {
	const at = locate(list, id)
	if (!at) throw new Error(`No node with id ${id}`)
	const copy = cloneNode(at.list[at.index], newId)
	at.list.splice(at.index + 1, 0, copy)
	return copy
}

// Items of the same repeat group under one parent, in order
export const repeatItems = (list: TreeNode[], id: NodeId) => {
	const at = locate(list, id)
	const node = at?.list[at.index]
	if (!at || !isElement(node) || !node.repeat) return []
	return at.list.filter(
		(sibling): sibling is ElementNode =>
			isElement(sibling) && sibling.repeat === node.repeat
	)
}

export const addRepeatItem = (
	list: TreeNode[],
	id: NodeId,
	newId: IdFactory
) => {
	if (repeatItems(list, id).length === 0) throw new Error('Not a repeat item')
	return duplicateNode(list, id, newId)
}

// The last item stays, it is the template for new ones
export const removeRepeatItem = (list: TreeNode[], id: NodeId) => {
	const items = repeatItems(list, id)
	if (items.length === 0) throw new Error('Not a repeat item')
	if (items.length === 1) throw new Error('The last item cannot be removed')
	removeNode(list, id)
}

// Moves an item by one step within its repeat group
export const shiftRepeatItem = (list: TreeNode[], id: NodeId, step: -1 | 1) => {
	const items = repeatItems(list, id)
	const position = items.findIndex((item) => item.id === id)
	const neighbour = items[position + step]
	if (!neighbour) return
	const at = locate(list, id)!
	const from = at.index
	const to = at.list.indexOf(neighbour)
	const [node] = at.list.splice(from, 1)
	at.list.splice(to, 0, node)
}

// Every class token used in the tree, the input for the CSS build
export const collectClasses = (list: TreeNode[], into = new Set<string>()) => {
	walk(list, (node) => {
		if (!isElement(node)) return
		for (const name of node.classes.split(/\s+/)) if (name) into.add(name)
	})
	return into
}
