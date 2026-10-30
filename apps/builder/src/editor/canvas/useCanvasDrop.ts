import { useCallback, useEffect, useState } from 'react'
import { locate } from '@ui-system/core'
import { toast } from 'sonner'
import {
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { hitAt } from '@/editor/canvas/dropResolve'
import type { Rect } from '@/editor/canvas/dropTarget'
import { PAGE_ROOT } from '@/editor/canvas/frame'
import { asComponent, asElement, asPreset } from '@/editor/dnd'
import {
	asNode,
	canDropNode,
	currentSections,
} from '@/editor/navigator/dragHelpers'
import { useNav } from '@/editor/navigator/navState'
import {
	addInstanceSection,
	insertElement,
	insertInstance,
	moveNodeTo,
	placePreset,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { useCurrentPage, useProject } from '@/store/project'

// What the indicator draws, in iframe coordinates
export type DropView =
	| { kind: 'section'; y: number }
	| { kind: 'inside'; line: Rect | null; outline: Rect | null }
	| { kind: 'blocked'; message: string; x: number; y: number }

type Data = Record<string | symbol, unknown>

type Plan =
	| { kind: 'section'; index: number }
	| { kind: 'place'; parentId: string; index: number }

interface Resolved {
	view: DropView | null
	plan: Plan | null
}

const NONE: Resolved = { view: null, plan: null }

// Insertion index between page sections for a height in iframe coordinates
const sectionAt = (doc: Document, ids: string[], y: number) => {
	const page = doc.getElementById(PAGE_ROOT)
	const rects = [...(page?.children ?? [])]
		.filter((el) => ids.includes(el.getAttribute('data-node-id') ?? ''))
		.map((el) => el.getBoundingClientRect())
	let index = 0
	while (index < rects.length) {
		const r = rects[index]
		if (y < r.top + r.height / 2) break
		index++
	}
	const line =
		index < rects.length
			? rects[index].top
			: rects.length > 0
				? rects[rects.length - 1].bottom
				: 0
	return { index, y: line }
}

// Sections and section components land between sections, the rest inside them
const isSectionDrag = (data: Data) => {
	if (asPreset(data)) return true
	const component = asComponent(data)
	if (!component) return false
	const master = useDocument.getState().doc?.components[component.componentId]
	return Boolean(master?.root.section)
}

const droppable = (data: Data) => {
	if (asElement(data) || asNode(data)) return true
	const editing = Boolean(useProject.getState().editingComponentId)
	return !editing && (asPreset(data) !== null || asComponent(data) !== null)
}

// Plan and indicator for a pointer position given in iframe coordinates
const resolve = (
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
	if (!hit) return NONE
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

const execute = (data: Data, plan: Plan) => {
	const preset = asPreset(data)
	const component = asComponent(data)
	if (plan.kind === 'section') {
		if (preset) run(() => placePreset(preset.presetId, plan.index))
		else if (component) {
			run(() => addInstanceSection(component.componentId, plan.index))
		}
		return
	}
	const element = asElement(data)
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

// Lets catalog presets, elements and components be dropped on the canvas iframe.
// A transparent element above the iframe takes the drag events while a drag is active.
export function useCanvasDrop(scale: number) {
	const doc = useCanvas((s) => s.doc)
	const page = useCurrentPage()
	const [target, setTarget] = useState<HTMLElement | null>(null)
	const [active, setActive] = useState(false)
	const [view, setView] = useState<DropView | null>(null)
	const ref = useCallback((el: HTMLElement | null) => setTarget(el), [])
	const sectionIds = page?.sections.map((s) => s.id).join(',') ?? ''

	useEffect(
		() =>
			monitorForElements({
				canMonitor: ({ source }) => droppable(source.data),
				onDragStart: () => setActive(true),
				onDrop: () => {
					setActive(false)
					setView(null)
				},
			}),
		[]
	)

	useEffect(() => {
		if (!target || !doc) return
		const ids = sectionIds ? sectionIds.split(',') : []
		// Parent pointer position to iframe coordinates, the overlay shares the scaled box
		const resolveAt = (
			data: Data,
			input: { clientX: number; clientY: number }
		) => {
			const box = target.getBoundingClientRect()
			return resolve(
				doc,
				data,
				ids,
				(input.clientX - box.left) / scale,
				(input.clientY - box.top) / scale
			)
		}
		return dropTargetForElements({
			element: target,
			canDrop: ({ source }) => droppable(source.data),
			onDrag: ({ source, location }) =>
				setView(resolveAt(source.data, location.current.input).view),
			onDragLeave: () => setView(null),
			onDrop: ({ source, location }) => {
				const { plan } = resolveAt(source.data, location.current.input)
				if (plan) execute(source.data, plan)
			},
		})
	}, [target, doc, scale, sectionIds])

	return { ref, active, view }
}
