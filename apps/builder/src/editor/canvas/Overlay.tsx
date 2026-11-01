import { useEffect, useRef, useState } from 'react'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { findElement, locate } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import { labelOf, scopeOf } from '@/editor/canvas/nodes'
import { nodeDrag } from '@/editor/navigator/dragHelpers'
import { useRoots } from '@/editor/canvas/useRoots'
import { t } from '@/i18n'
import { useProject } from '@/store/project'

interface Box {
	top: number
	left: number
	width: number
	height: number
}

// Re-measures on every frame while the canvas scrolls, resizes or changes
function useFrameTick(doc: Document | null) {
	const [tick, setTick] = useState(0)
	useEffect(() => {
		if (!doc?.defaultView) return
		const win = doc.defaultView
		let raf = 0
		const bump = () => {
			win.cancelAnimationFrame(raf)
			raf = win.requestAnimationFrame(() => setTick((t) => t + 1))
		}
		const resize = new win.ResizeObserver(bump)
		resize.observe(doc.body)
		const mutations = new win.MutationObserver(bump)
		mutations.observe(doc.body, {
			subtree: true,
			childList: true,
			attributes: true,
			characterData: true,
		})
		win.addEventListener('scroll', bump, true)
		win.addEventListener('resize', bump)
		return () => {
			win.cancelAnimationFrame(raf)
			resize.disconnect()
			mutations.disconnect()
			win.removeEventListener('scroll', bump, true)
			win.removeEventListener('resize', bump)
		}
	}, [doc])
	return tick
}

const measure = (doc: Document | null, id: string | null): Box | null => {
	if (!doc || !id) return null
	const el = elementFor(doc, id)
	if (!el) return null
	const rect = el.getBoundingClientRect()
	return {
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
	}
}

// Label chip, a drag handle when the element may be moved on the canvas
function Chip({
	label,
	dragId,
	component,
	scale,
}: {
	label: string
	dragId?: string
	component: boolean
	scale: number
}) {
	const ref = useRef<HTMLSpanElement>(null)
	useEffect(() => {
		const el = ref.current
		if (!el || !dragId) return
		return draggable({
			element: el,
			getInitialData: () => ({ ...nodeDrag(dragId) }),
		})
	}, [dragId])
	return (
		<span
			ref={ref}
			title={dragId ? t('overlay.drag') : undefined}
			className={`absolute left-0 rounded-sm ${component ? 'bg-purple-600' : 'bg-blue-500'} px-1.5 py-0.5 font-sans font-medium whitespace-nowrap text-white ${dragId ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}`}
			style={{
				bottom: '100%',
				fontSize: 11 / scale,
				transformOrigin: 'bottom left',
			}}
		>
			{label}
		</span>
	)
}

function Frame({
	box,
	label,
	dragId,
	selected,
	scale,
	component = false,
}: {
	box: Box
	label?: string
	dragId?: string
	selected: boolean
	scale: number
	// Components are drawn in purple
	component?: boolean
}) {
	return (
		<div
			className={
				selected
					? `pointer-events-none absolute ${component ? 'outline-purple-500' : 'outline-blue-500'}`
					: `pointer-events-none absolute outline-dashed ${component ? 'outline-purple-500/70' : 'outline-blue-400/70'}`
			}
			style={{
				top: box.top,
				left: box.left,
				width: box.width,
				height: box.height,
				outlineWidth: (selected ? 2 : 1) / scale,
				outlineStyle: selected ? 'solid' : 'dashed',
			}}
		>
			{label && (
				<Chip
					label={label}
					dragId={dragId}
					component={component}
					scale={scale}
				/>
			)}
		</div>
	)
}

// Hover and selection outlines drawn above the iframe in its own coordinates
export function Overlay({ scale }: { scale: number }) {
	const doc = useCanvas((s) => s.doc)
	const roots = useRoots()
	const selectedId = useProject((s) => s.selectedId)
	const hoveredId = useProject((s) => s.hoveredId)
	useFrameTick(doc)

	const selected = measure(doc, selectedId)
	const hovered = hoveredId !== selectedId ? measure(doc, hoveredId) : null
	const node = selectedId ? findElement(roots, selectedId) : null
	const hoverNode = hoveredId ? findElement(roots, hoveredId) : null
	const editing = useProject((s) => s.editingComponentId)
	// Free scope below a section root, the same rule the canvas drop applies
	const movable =
		selectedId !== null &&
		locate(roots, selectedId)?.parent != null &&
		scopeOf(roots, selectedId, Boolean(editing)) === 'free'

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden'>
			{hovered && (
				<Frame
					box={hovered}
					selected={false}
					scale={scale}
					component={Boolean(hoverNode?.instance)}
					label={hoverNode?.instance ? labelOf(hoverNode) : undefined}
				/>
			)}
			{selected && (
				<Frame
					box={selected}
					selected
					scale={scale}
					component={Boolean(node?.instance)}
					label={node ? labelOf(node) : undefined}
					dragId={movable ? (selectedId ?? undefined) : undefined}
				/>
			)}
		</div>
	)
}
