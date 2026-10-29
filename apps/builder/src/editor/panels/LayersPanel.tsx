import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ElementNode } from '@ui-system/core'
import {
	draggable,
	dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Button } from '@/components/ui/button'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import { labelOf } from '@/editor/canvas/nodes'
import { asLayer, layerDrag } from '@/editor/dnd'
import { moveSection } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useCurrentPage, useProject } from '@/store/project'

type Edge = 'top' | 'bottom'

function useRowActions(id: string) {
	const select = useProject((s) => s.select)
	const hover = useProject((s) => s.hover)
	return {
		choose: () => {
			select(id)
			const doc = useCanvas.getState().doc
			if (doc) elementFor(doc, id)?.scrollIntoView({ block: 'nearest' })
		},
		onEnter: () => hover(id),
		onLeave: () => hover(null),
	}
}

function FixedRow({ node }: { node: ElementNode }) {
	const selected = useProject((s) => s.selectedId === node.id)
	const { choose, onEnter, onLeave } = useRowActions(node.id)
	return (
		<div
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
			className={`flex h-8 items-center rounded-md px-2 text-sm ${selected ? 'bg-accent' : 'hover:bg-accent/50'}`}
		>
			<button
				type='button'
				className='flex-1 truncate text-left outline-none'
				onClick={choose}
			>
				{labelOf(node)}
			</button>
			<span className='text-muted-foreground text-xs'>Shared</span>
		</div>
	)
}

function SectionRow({
	node,
	index,
	count,
}: {
	node: ElementNode
	index: number
	count: number
}) {
	const ref = useRef<HTMLDivElement>(null)
	const [edge, setEdge] = useState<Edge | null>(null)
	const [dragging, setDragging] = useState(false)
	const selected = useProject((s) => s.selectedId === node.id)
	const { choose, onEnter, onLeave } = useRowActions(node.id)
	const id = node.id

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const edgeAt = (y: number): Edge => {
			const r = el.getBoundingClientRect()
			return y < r.top + r.height / 2 ? 'top' : 'bottom'
		}
		// Index the dragged section ends up at when dropped on this edge
		const destination = (fromId: string, at: Edge) => {
			const sections =
				useDocument.getState().doc?.pages[
					useProject.getState().currentPageId ?? ''
				]?.sections ?? []
			const from = sections.findIndex((s) => s.id === fromId)
			const self = sections.findIndex((s) => s.id === id)
			if (from < 0 || self < 0) return null
			const raw = at === 'top' ? self : self + 1
			return from < raw ? raw - 1 : raw
		}
		const clear = () => setEdge(null)
		const stopDrag = draggable({
			element: el,
			getInitialData: () => ({ ...layerDrag(id) }),
			onDragStart: () => setDragging(true),
			onDrop: () => setDragging(false),
		})
		const stopDrop = dropTargetForElements({
			element: el,
			canDrop: ({ source }) => {
				const layer = asLayer(source.data)
				return layer !== null && layer.id !== id
			},
			onDrag: ({ location }) =>
				setEdge(edgeAt(location.current.input.clientY)),
			onDragLeave: clear,
			onDrop: ({ source, location }) => {
				clear()
				const layer = asLayer(source.data)
				if (!layer) return
				const to = destination(
					layer.id,
					edgeAt(location.current.input.clientY)
				)
				if (to !== null) moveSection(layer.id, to)
			},
		})
		return () => {
			stopDrag()
			stopDrop()
		}
	}, [id])

	return (
		<div
			ref={ref}
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
			className={`relative flex h-8 items-center rounded-md pr-1 pl-2 text-sm ${selected ? 'bg-accent' : 'hover:bg-accent/50'} ${dragging ? 'opacity-50' : ''}`}
		>
			<button
				type='button'
				className='flex-1 cursor-grab truncate text-left outline-none'
				onClick={choose}
			>
				{labelOf(node)}
			</button>
			<Button
				variant='ghost'
				size='icon-xs'
				aria-label='Move up'
				disabled={index === 0}
				onClick={() => moveSection(id, index - 1)}
			>
				<ChevronUp />
			</Button>
			<Button
				variant='ghost'
				size='icon-xs'
				aria-label='Move down'
				disabled={index === count - 1}
				onClick={() => moveSection(id, index + 1)}
			>
				<ChevronDown />
			</Button>
			{edge && (
				<div
					className={`pointer-events-none absolute right-0 left-0 h-0.5 bg-blue-500 ${edge === 'top' ? '-top-px' : '-bottom-px'}`}
				/>
			)}
		</div>
	)
}

export function LayersPanel() {
	const page = useCurrentPage()
	const header = useDocument((s) => s.doc?.partials.header ?? null)
	const footer = useDocument((s) => s.doc?.partials.footer ?? null)
	if (!page) return null
	return (
		<div className='flex flex-col gap-0.5 p-2'>
			{page.showHeader && header && <FixedRow node={header} />}
			{page.sections.length === 0 && (
				<p className='text-muted-foreground p-2 text-sm'>
					No sections yet
				</p>
			)}
			{page.sections.map((node, i) => (
				<SectionRow
					key={node.id}
					node={node}
					index={i}
					count={page.sections.length}
				/>
			))}
			{page.showFooter && footer && <FixedRow node={footer} />}
		</div>
	)
}
