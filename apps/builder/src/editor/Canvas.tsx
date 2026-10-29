import { useEffect, useRef, useState } from 'react'
import { locate } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import {
	createFrameCache,
	frameSrcdoc,
	nodeIdAt,
	syncRoots,
} from '@/editor/canvas/frame'
import { pickTarget } from '@/editor/canvas/nodes'
import { Overlay } from '@/editor/canvas/Overlay'
import { useCanvasCss } from '@/editor/canvas/useCanvasCss'
import { useRoots } from '@/editor/canvas/useRoots'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const PADDING = 24

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
	const [size, setSize] = useState({ width: 0, height: 0 })
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const observer = new ResizeObserver(([entry]) =>
			setSize({
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			})
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [ref])
	return size
}

export function Canvas() {
	const width = useProject((s) => s.canvasWidth)
	const theme = useDocument((s) => s.doc?.site.theme)
	const roots = useRoots()
	const doc = useCanvas((s) => s.doc)
	const setDoc = useCanvas((s) => s.setDoc)
	const editingId = useCanvas((s) => s.editingId)
	const containerRef = useRef<HTMLDivElement>(null)
	const frameRef = useRef<HTMLIFrameElement>(null)
	const [cache] = useState(createFrameCache)
	const [srcdoc] = useState(frameSrcdoc)
	const rootsRef = useRef(roots)
	const size = useContainerSize(containerRef)

	useEffect(() => {
		rootsRef.current = roots
	}, [roots])

	useEffect(() => () => setDoc(null), [setDoc])

	// The root that holds the slot being edited inline
	const editingRoot = editingId
		? (roots.find((root) => locate([root], editingId))?.id ?? null)
		: null

	useEffect(() => {
		if (doc) syncRoots(doc, cache, roots, editingRoot)
	}, [doc, cache, roots, editingRoot])

	useCanvasCss(doc, roots, theme)

	// Pointer and form events stay inside the canvas
	useEffect(() => {
		if (!doc) return
		const { hover, select } = useProject.getState()
		const target = (e: Event) =>
			pickTarget(rootsRef.current, nodeIdAt(e.target))
		const onMove = (e: MouseEvent) => hover(target(e))
		const onLeave = () => hover(null)
		const onClick = (e: MouseEvent) => {
			const editing = useCanvas.getState().editingId
			if (
				editing &&
				(e.target as Element).closest?.('[contenteditable]')
			) {
				return
			}
			e.preventDefault()
			select(target(e))
		}
		const onSubmit = (e: Event) => e.preventDefault()
		doc.addEventListener('mousemove', onMove)
		doc.documentElement.addEventListener('mouseleave', onLeave)
		doc.addEventListener('click', onClick, true)
		doc.addEventListener('submit', onSubmit, true)
		return () => {
			doc.removeEventListener('mousemove', onMove)
			doc.documentElement.removeEventListener('mouseleave', onLeave)
			doc.removeEventListener('click', onClick, true)
			doc.removeEventListener('submit', onSubmit, true)
		}
	}, [doc])

	const available = Math.max(size.width - PADDING * 2, 100)
	const scale = Math.min(1, available / width)
	const height = Math.max(size.height - PADDING * 2, 100) / scale

	return (
		<div
			ref={containerRef}
			className='bg-muted relative h-full overflow-hidden'
			onClick={(e) => {
				if (e.target === e.currentTarget)
					useProject.getState().select(null)
			}}
		>
			<div
				className='absolute shadow-sm'
				style={{
					top: PADDING,
					left: Math.max(PADDING, (size.width - width * scale) / 2),
					width,
					height,
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
				}}
			>
				<iframe
					ref={frameRef}
					title='Page canvas'
					srcDoc={srcdoc}
					className='block size-full border-0 bg-white'
					onLoad={() =>
						setDoc(frameRef.current?.contentDocument ?? null)
					}
				/>
				<Overlay scale={scale} />
			</div>
		</div>
	)
}
