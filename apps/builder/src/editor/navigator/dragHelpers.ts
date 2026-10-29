import {
	ancestorsOf,
	locate,
	sectionOf,
	type ElementNode,
} from '@ui-system/core'
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

export const currentSections = (): ElementNode[] =>
	useDocument.getState().doc?.pages[useProject.getState().currentPageId ?? '']
		?.sections ?? []

// Same section only, and never onto itself or its own descendants
export const canDropNode = (sourceId: string, targetId: string) => {
	if (sourceId === targetId) return false
	const sections = currentSections()
	if (ancestorsOf(sections, targetId).some((a) => a.id === sourceId)) {
		return false
	}
	const from = sectionOf(sections, sourceId)
	const to = sectionOf(sections, targetId)
	return from !== null && from.id === to?.id && from.id !== sourceId
}

export const dropNode = (sourceId: string, targetId: string, zone: Zone) => {
	if (!canDropNode(sourceId, targetId)) return
	const sections = currentSections()
	const source = locate(sections, sourceId)
	const target = locate(sections, targetId)
	if (!source?.parent || !target) return
	const place = resolveDrop(
		zone,
		{
			id: targetId,
			parentId: target.parent?.id ?? null,
			index: target.index,
			childCount: (target.list[target.index] as ElementNode).children
				.length,
		},
		{ parentId: source.parent.id, index: source.index }
	)
	if (!place) return
	moveNodeTo(sourceId, place.parentId, place.index)
	useNav.getState().setOpen([place.parentId])
	useProject.getState().select(sourceId)
}
