import {
	ancestorsOf,
	findElement,
	locate,
	type ElementNode,
} from '@ui-system/core'
import { scopeOf } from '@/editor/canvas/nodes'
import type { Place } from './dropPosition'
import { canContain } from './structure'

// Where a palette element goes: last child of the selection, or right after it.
// Only free scope takes elements, never the inside of an instance
export const insertPlace = (
	roots: ElementNode[],
	selectedId: string | null,
	editing = false
): Place | null => {
	if (!selectedId) return null
	const node = findElement(roots, selectedId)
	if (!node || scopeOf(roots, selectedId, editing) !== 'free') return null
	if (!node.instance && (node.section || canContain(node))) {
		return { parentId: node.id, index: node.children.length }
	}
	const parent = ancestorsOf(roots, node.id).at(-1)
	const at = locate(roots, node.id)
	if (!parent || !at) return null
	return { parentId: parent.id, index: at.index + 1 }
}

// Why nothing can be inserted for this selection, null when a place exists
export const insertBlocker = (
	roots: ElementNode[],
	selectedId: string | null,
	editing = false
): string | null => {
	if (insertPlace(roots, selectedId, editing)) return null
	const node = selectedId ? findElement(roots, selectedId) : null
	if (!selectedId || !node) {
		return 'Select a container in an unlocked section, or click Add empty block'
	}
	const chain = [...ancestorsOf(roots, node.id), node]
	if (chain.some((el) => el.instance)) {
		return 'Elements cannot be added inside a component instance'
	}
	return 'Unlock the section to add elements'
}
