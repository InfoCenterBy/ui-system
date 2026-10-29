import {
	ancestorsOf,
	findElement,
	locate,
	sectionOf,
	type ElementNode,
} from '@ui-system/core'
import type { Place } from './dropPosition'
import { canContain } from './structure'

// Where a palette element goes: last child of the selection, or right after it
export const insertPlace = (
	roots: ElementNode[],
	selectedId: string | null
): Place | null => {
	if (!selectedId) return null
	const node = findElement(roots, selectedId)
	const section = sectionOf(roots, selectedId)
	if (!node || !section?.section || section.section.locked) return null
	if (node.section || canContain(node)) {
		return { parentId: node.id, index: node.children.length }
	}
	const parent = ancestorsOf(roots, node.id).at(-1)
	const at = locate(roots, node.id)
	if (!parent || !at) return null
	return { parentId: parent.id, index: at.index + 1 }
}
