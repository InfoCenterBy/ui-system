import { useEffect, useState } from 'react'
import { findElement } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import { labelOf } from '@/editor/canvas/nodes'
import { useRoots } from '@/editor/canvas/useRoots'
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

function Frame({
	box,
	label,
	selected,
	scale,
}: {
	box: Box
	label?: string
	selected: boolean
	scale: number
}) {
	return (
		<div
			className={
				selected
					? 'pointer-events-none absolute outline-blue-500'
					: 'pointer-events-none absolute outline-blue-400/70 outline-dashed'
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
				<span
					className='absolute left-0 rounded-sm bg-blue-500 px-1.5 py-0.5 font-sans font-medium whitespace-nowrap text-white'
					style={{
						bottom: '100%',
						fontSize: 11 / scale,
						transformOrigin: 'bottom left',
					}}
				>
					{label}
				</span>
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

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden'>
			{hovered && <Frame box={hovered} selected={false} scale={scale} />}
			{selected && (
				<Frame
					box={selected}
					selected
					scale={scale}
					label={node ? labelOf(node) : undefined}
				/>
			)}
		</div>
	)
}
