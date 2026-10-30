import { locate } from '@ui-system/core'
import { toast } from 'sonner'
import { hitAt } from '@/editor/canvas/dropResolve'
import type { Rect } from '@/editor/canvas/dropTarget'
import { PAGE_ROOT } from '@/editor/canvas/frame'
import { gapAt } from '@/editor/canvas/sectionGap'
import { asComponent, asElement, asPreset } from '@/editor/dnd'
import {
	asNode,
	canDropNode,
	currentSections,
} from '@/editor/navigator/dragHelpers'
import { useNav } from '@/editor/navigator/navState'
import {
	addCustomBlock,
	addInstanceSection,
	insertElement,
	insertInstance,
	moveNodeTo,
	placePreset,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

// What the indicator draws, in iframe coordinates
export type DropView =
	| { kind: 'section'; y: number }
	| { kind: 'inside'; line: Rect | null; outline: Rect | null }
	| { kind: 'blocked'; message: string; x: number; y: number }

export type Data = Record<string | symbol, unknown>

export type Plan =
	| { kind: 'section'; index: number }
	// A new Custom block that takes the dropped element
	| { kind: 'block'; index: number }
	| { kind: 'place'; parentId: string; index: number }

export interface Resolved {
	view: DropView | null
	plan: Plan | null
}

const NONE: Resolved = { view: null, plan: null }

// Insertion index between page sections for a height in iframe coordinates
const sectionAt = (doc: Document, ids: string[], y: number) => {
	const page = doc.getElementById(PAGE_ROOT)
	const spans = [...(page?.children ?? [])]
		.filter((el) => ids.includes(el.getAttribute('data-node-id') ?? ''))
		.map((el) => el.getBoundingClientRect())
	return gapAt(spans, y)
}

// Sections and section components land between sections, the rest inside them
const isSectionDrag = (data: Data) => {
	if (asPreset(data)) return true
	const component = asComponent(data)
	if (!component) return false
	const master = useDocument.getState().doc?.components[component.componentId]
	return Boolean(master?.root.section)
}

export const droppable = (data: Data) => {
	if (asElement(data) || asNode(data)) return true
	const editing = Boolean(useProject.getState().editingComponentId)
	return !editing && (asPreset(data) !== null || asComponent(data) !== null)
}

// Plan and indicator for a pointer position given in iframe coordinates
export const resolve = (
	doc: Document,
	data: Data,
	ids: string[],
	x: number,
	y: number
): Resolved => {
	if (isSectionDrag(data)) {
		const at = sectionAt(doc, ids, y)
		return {
			view: { kind: 'section', y: at.y },
			plan: { kind: 'section', index: at.index },
		}
	}
	const editing = Boolean(useProject.getState().editingComponentId)
	const hit = hitAt(doc, currentSections(), x, y, editing)
	if (!hit) {
		// Over no section: a library element starts a Custom block there
		if (!asElement(data) || editing) return NONE
		const at = sectionAt(doc, ids, y)
		return {
			view: { kind: 'section', y: at.y },
			plan: { kind: 'block', index: at.index },
		}
	}
	if (hit.kind === 'blocked') {
		return {
			view: { kind: 'blocked', message: hit.message, x, y },
			plan: null,
		}
	}
	const node = asNode(data)
	if (node && !canDropNode(node.id, hit.spot.parentId)) return NONE
	return {
		view: {
			kind: 'inside',
			line: hit.spot.line,
			outline: hit.spot.outline,
		},
		plan: { kind: 'place', parentId: hit.spot.parentId, index: hit.index },
	}
}

const run = (action: () => unknown) => {
	try {
		const result = action()
		if (result instanceof Promise) {
			result.catch((e: Error) => toast.error(e.message))
		}
	} catch (e) {
		toast.error((e as Error).message)
	}
}

export const execute = (data: Data, plan: Plan) => {
	const preset = asPreset(data)
	const component = asComponent(data)
	const element = asElement(data)
	if (plan.kind === 'section') {
		if (preset) run(() => placePreset(preset.presetId, plan.index))
		else if (component) {
			run(() => addInstanceSection(component.componentId, plan.index))
		}
		return
	}
	if (plan.kind === 'block') {
		if (element) run(() => addCustomBlock(plan.index, element.html))
		return
	}
	const node = asNode(data)
	if (element) {
		run(() => insertElement(plan.parentId, plan.index, element.html))
	} else if (component) {
		run(() =>
			insertInstance(component.componentId, plan.parentId, plan.index)
		)
	} else if (node) {
		const from = locate(currentSections(), node.id)
		if (!from) return
		// The index counts after the node leaves its old place
		const shift =
			from.parent?.id === plan.parentId && from.index < plan.index ? 1 : 0
		// Dropped back on its own place: no move, no undo step
		if (
			from.parent?.id === plan.parentId &&
			from.index === plan.index - shift
		) {
			return
		}
		run(() => {
			moveNodeTo(node.id, plan.parentId, plan.index - shift)
			useNav.getState().setOpen([plan.parentId])
			useProject.getState().select(node.id)
		})
	}
}
