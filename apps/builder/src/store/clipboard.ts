import {
	ancestorsOf,
	cloneNode,
	detachInstance,
	findElement,
	isElement,
	locate,
	prepareInsert,
	type ElementNode,
	type IdFactory,
	type TreeNode,
} from '@ui-system/core'
import { scopeOf } from '@/editor/canvas/nodes'
import { canContain } from '@/editor/navigator/structure'

export type ClipKind = 'section' | 'element'

export interface ClipPayload {
	uiBuilder: 1
	kind: ClipKind
	nodes: ElementNode[]
}

export const serializeClip = (kind: ClipKind, nodes: ElementNode[]) =>
	JSON.stringify({ uiBuilder: 1, kind, nodes } satisfies ClipPayload)

// Null for anything that is not a builder payload, plain text included
export const parseClip = (text: string | null | undefined) => {
	if (!text || text[0] !== '{') return null
	let data: Partial<ClipPayload> | null
	try {
		data = JSON.parse(text)
	} catch {
		return null
	}
	if (!data || data.uiBuilder !== 1) return null
	if (data.kind !== 'section' && data.kind !== 'element') return null
	const { nodes } = data
	if (!Array.isArray(nodes) || nodes.length === 0) return null
	const valid = nodes.every(
		(n) =>
			n &&
			typeof n === 'object' &&
			n.type === 'element' &&
			typeof n.id === 'string' &&
			typeof n.tag === 'string' &&
			Array.isArray(n.children)
	)
	return valid ? ({ ...data, nodes } as ClipPayload) : null
}

const mapElements = (
	nodes: TreeNode[],
	fn: (el: ElementNode) => ElementNode
): TreeNode[] =>
	nodes.map((node) => {
		if (!isElement(node)) return node
		const next = fn(node)
		return next.instance
			? next
			: { ...next, children: mapElements(next.children, fn) }
	})

// Instances of unknown components become plain trees, refs go away with them
export const flattenUnknown = (
	nodes: ElementNode[],
	hasComponent: (id: string) => boolean
) =>
	mapElements(nodes, (el) =>
		el.instance && !hasComponent(el.instance.component)
			? detachInstance(el)
			: el
	) as ElementNode[]

// Copies for inserting: fresh node ids, unique html ids and anchors
export const freshCopy = (
	nodes: ElementNode[],
	newId: IdFactory,
	hasComponent: (id: string) => boolean
) =>
	prepareInsert(
		flattenUnknown(nodes, hasComponent).map((n) => cloneNode(n, newId)),
		{ newId: () => newId().slice(0, 6) }
	) as ElementNode[]

export type PasteBlock = 'select' | 'locked' | 'editing'

export type PasteTarget =
	| { kind: 'section'; index: number }
	| { kind: 'element'; parentId: string; index: number }
	| { blocked: PasteBlock }

interface Where {
	// Everything drawn on the canvas, header and footer included
	roots: ElementNode[]
	// Sections of the current page
	sections: ElementNode[]
	selectedId: string | null
	headerId?: string | null
	footerId?: string | null
	editing: boolean
}

// Where a payload goes for the current selection
export const resolvePaste = (kind: ClipKind, where: Where): PasteTarget => {
	const { roots, sections, selectedId, editing } = where
	if (kind === 'section') {
		if (editing) return { blocked: 'editing' }
		if (!selectedId) return { kind: 'section', index: sections.length }
		if (selectedId === where.headerId) return { kind: 'section', index: 0 }
		if (selectedId === where.footerId) {
			return { kind: 'section', index: sections.length }
		}
		const owner = sections.findIndex(
			(s) => s.id === selectedId || findElement([s], selectedId)
		)
		return {
			kind: 'section',
			index: owner < 0 ? sections.length : owner + 1,
		}
	}
	const node = selectedId ? findElement(roots, selectedId) : null
	if (!node) return { blocked: 'select' }
	if (scopeOf(roots, node.id, editing) !== 'free') {
		return { blocked: 'locked' }
	}
	const parent = ancestorsOf(roots, node.id).at(-1)
	// A section root or an empty container takes the element inside
	const inside =
		!node.instance &&
		(node.section || (node.children.length === 0 && canContain(node)))
	if (inside || !parent) {
		if (node.instance) return { blocked: 'locked' }
		return {
			kind: 'element',
			parentId: node.id,
			index: node.children.length,
		}
	}
	if (parent.instance || scopeOf(roots, parent.id, editing) !== 'free') {
		return { blocked: 'locked' }
	}
	const at = locate(roots, node.id)
	return {
		kind: 'element',
		parentId: parent.id,
		index: (at?.index ?? parent.children.length - 1) + 1,
	}
}
