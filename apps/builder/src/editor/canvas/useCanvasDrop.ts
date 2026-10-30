import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { PAGE_ROOT } from '@/editor/canvas/frame'
import { asComponent, asPreset } from '@/editor/dnd'
import { addInstanceSection, placePreset } from '@/store/actions'
import { useCurrentPage, useProject } from '@/store/project'

export interface DropPoint {
	index: number
	// Line position in iframe coordinates
	y: number
}

// Insertion index for a pointer height given in iframe coordinates
const pointAt = (doc: Document, ids: string[], y: number): DropPoint => {
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

// Presets and section components can be dropped, pages only, not in component mode
const droppable = (data: Parameters<typeof asPreset>[0]) =>
	!useProject.getState().editingComponentId &&
	(asPreset(data) !== null || asComponent(data) !== null)

// Lets catalog presets be dropped on the canvas iframe. A transparent element
// above the iframe takes the drag events while a preset drag is active.
export function useCanvasDrop(scale: number) {
	const doc = useCanvas((s) => s.doc)
	const page = useCurrentPage()
	const [target, setTarget] = useState<HTMLElement | null>(null)
	const [active, setActive] = useState(false)
	const [point, setPoint] = useState<DropPoint | null>(null)
	const ref = useCallback((el: HTMLElement | null) => setTarget(el), [])
	const sectionIds = page?.sections.map((s) => s.id).join(',') ?? ''

	useEffect(
		() =>
			monitorForElements({
				canMonitor: ({ source }) => droppable(source.data),
				onDragStart: () => setActive(true),
				onDrop: () => {
					setActive(false)
					setPoint(null)
				},
			}),
		[]
	)

	useEffect(() => {
		if (!target || !doc) return
		const ids = sectionIds ? sectionIds.split(',') : []
		// Parent pointer position to iframe coordinates, the overlay shares the scaled box
		const locate = (clientY: number) =>
			pointAt(
				doc,
				ids,
				(clientY - target.getBoundingClientRect().top) / scale
			)
		return dropTargetForElements({
			element: target,
			canDrop: ({ source }) => droppable(source.data),
			onDrag: ({ location }) =>
				setPoint(locate(location.current.input.clientY)),
			onDragLeave: () => setPoint(null),
			onDrop: ({ source, location }) => {
				const index = locate(location.current.input.clientY).index
				const preset = asPreset(source.data)
				const component = asComponent(source.data)
				try {
					if (preset) placePreset(preset.presetId, index)
					else if (component) {
						addInstanceSection(component.componentId, index)
					}
				} catch (e) {
					toast.error((e as Error).message)
				}
			},
		})
	}, [target, doc, scale, sectionIds])

	return { ref, active, point }
}
