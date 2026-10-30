import { useCallback, useEffect, useState } from 'react'
import {
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useCanvas } from '@/editor/canvas/canvasStore'
import {
	droppable,
	execute,
	resolve,
	type Data,
	type DropView,
} from '@/editor/canvas/dropPlan'
import { useElementMove } from '@/editor/canvas/useElementMove'
import { useCurrentPage } from '@/store/project'

export type { DropView }

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

	const move = useElementMove(scale, sectionIds)
	return {
		ref,
		active,
		visible: active || move.moving,
		view: move.moving ? move.view : view,
	}
}
