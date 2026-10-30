import {
	ancestorsOf,
	findElement,
	locate,
	sectionOf,
	type ElementNode,
} from '@ui-system/core'
import { scopeOf } from '@/editor/canvas/nodes'
import { moveNodeTo } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'
import { resolveDrop, type Zone } from './dropPosition'
import { useNav } from './navState'

export interface NodeDrag {
	kind: 'node'
	id: string
}

export const nodeDrag = (id: string): NodeDrag => ({ kind: 'node', id })

export const asNode = (data: Record<string | symbol, unknown>) =>
	data.kind === 'node' && typeof data.id === 'string'
		? { kind: 'node' as const, id: data.id }
		: null

// What the navigator shows: page sections, or the master while a component is edited
export const currentSections = (): ElementNode[] => {
	const editing = useProject.getState().editingComponentId
	const doc = useDocument.getState().doc
	if (editing) {
		const root = doc?.components[editing]?.root
		return root ? [root] : []
	}
	return doc?.pages[useProject.getState().currentPageId ?? '']?.sections ?? []
}

// Same section only (or inside the master), free scope on both ends, and never
// onto itself or its own descendants
export const canDropNode = (sourceId: string, targetId: string) => {
	if (sourceId === targetId) return false
	const roots = currentSections()
	const editing = Boolean(useProject.getState().editingComponentId)
	if (ancestorsOf(roots, targetId).some((a) => a.id === sourceId)) {
		return false
	}
	const source = findElement(roots, sourceId)
	if (!source || !findElement(roots, targetId)) return false
	if (
		scopeOf(roots, sourceId, editing) !== 'free' ||
		scopeOf(roots, targetId, editing) !== 'free'
	) {
		return false
	}
	if (editing) return roots[0]?.id !== sourceId
	const from = sectionOf(roots, sourceId)
	const to = sectionOf(roots, targetId)
	return from !== null && from.id === to?.id && from.id !== sourceId
}

export const dropNode = (sourceId: string, targetId: string, zone: Zone) => {
	if (!canDropNode(sourceId, targetId)) return
	const sections = currentSections()
	const source = locate(sections, sourceId)
	const target = locate(sections, targetId)
	if (!source?.parent || !target) return
	const targetNode = target.list[target.index] as ElementNode
	// Nothing goes inside an instance
	if (zone === 'inside' && targetNode.instance) return
	const place = resolveDrop(
		zone,
		{
			id: targetId,
			parentId: target.parent?.id ?? null,
			index: target.index,
			childCount: targetNode.children.length,
		},
		{ parentId: source.parent.id, index: source.index }
	)
	if (!place) return
	moveNodeTo(sourceId, place.parentId, place.index)
	useNav.getState().setOpen([place.parentId])
	useProject.getState().select(sourceId)
}
