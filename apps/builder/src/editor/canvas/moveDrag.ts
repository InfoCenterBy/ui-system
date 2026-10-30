import { locate, type ElementNode } from '@ui-system/core'
import { scopeOf } from '@/editor/canvas/nodes'

// Pointer travel in screen pixels before a press becomes a move
export const MOVE_THRESHOLD = 5

export const passedThreshold = (
	from: { x: number; y: number },
	to: { x: number; y: number },
	scale: number
) => Math.hypot(to.x - from.x, to.y - from.y) * scale > MOVE_THRESHOLD

// Free scope and not a section root, the same rule as the label chip handle
export const canStartMove = (
	roots: ElementNode[],
	id: string | null,
	editing: boolean
) =>
	id !== null &&
	locate(roots, id)?.parent != null &&
	scopeOf(roots, id, editing) === 'free'
