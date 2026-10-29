import { useEffect, useRef, useState } from 'react'
import {
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Lock,
	LockOpen,
} from 'lucide-react'
import { ancestorsOf, type ElementNode } from '@ui-system/core'
import {
	draggable,
	dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { labelOf } from '@/editor/canvas/nodes'
import { asLayer, layerDrag } from '@/editor/dnd'
import { AddMenu } from '@/editor/navigator/AddMenu'
import { asNode, canDropNode, dropNode } from '@/editor/navigator/dragHelpers'
import { ElementRow, selectAndReveal } from '@/editor/navigator/ElementRow'
import { useNav } from '@/editor/navigator/navState'
import {
	flattenVisible,
	iconKeyOf,
	elementChildren,
} from '@/editor/navigator/structure'
import { deleteNode, moveSection, setSectionLocked } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useCurrentPage, useProject } from '@/store/project'

type Edge = 'top' | 'bottom'

function useRowActions(id: string) {
	const hover = useProject((s) => s.hover)
	return {
		choose: () => selectAndReveal(id),
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
	const [inside, setInside] = useState(false)
	const selected = useProject((s) => s.selectedId === node.id)
	const open = useNav((s) => Boolean(s.open[node.id]))
	const toggle = useNav((s) => s.toggle)
	const { choose, onEnter, onLeave } = useRowActions(node.id)
	const id = node.id
	const locked = node.section?.locked ?? false
	const expandable = !locked && elementChildren(node).length > 0

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
		// Elements of this section can be dropped on its row to become last children
		const stopNodeDrop = dropTargetForElements({
			element: el,
			canDrop: ({ source }) => {
				const drag = asNode(source.data)
				return drag !== null && canDropNode(drag.id, id)
			},
			onDragEnter: () => setInside(true),
			onDragLeave: () => setInside(false),
			onDrop: ({ source }) => {
				setInside(false)
				const drag = asNode(source.data)
				if (drag) dropNode(drag.id, id, 'inside')
			},
		})
		return () => {
			stopDrag()
			stopDrop()
			stopNodeDrop()
		}
	}, [id])

	return (
		<div
			ref={ref}
			data-nav-row={id}
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
			className={`relative flex h-8 items-center gap-1 rounded-md pr-1 pl-1 text-sm ${selected ? 'bg-accent' : 'hover:bg-accent/50'} ${dragging ? 'opacity-50' : ''} ${inside ? 'ring-1 ring-blue-500 ring-inset' : ''}`}
		>
			{locked ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className='text-muted-foreground flex size-4 shrink-0 items-center justify-center [&_svg]:size-3.5'>
							<Lock />
						</span>
					</TooltipTrigger>
					<TooltipContent>
						Unlock the section to edit its structure
					</TooltipContent>
				</Tooltip>
			) : (
				<button
					type='button'
					tabIndex={-1}
					aria-label={open ? 'Collapse' : 'Expand'}
					className={`text-muted-foreground flex size-4 shrink-0 items-center justify-center outline-none [&_svg]:size-3.5 ${expandable ? '' : 'invisible'}`}
					onClick={() => toggle(id)}
				>
					{open ? <ChevronDown /> : <ChevronRight />}
				</button>
			)}
			<button
				type='button'
				tabIndex={-1}
				className='flex-1 cursor-grab truncate text-left outline-none'
				onClick={choose}
			>
				{labelOf(node)}
			</button>
			{locked && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant='ghost'
							size='icon-xs'
							aria-label='Unlock'
							onClick={() => setSectionLocked(id, false)}
						>
							<LockOpen />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						Unlock the section to edit its structure
					</TooltipContent>
				</Tooltip>
			)}
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
	const open = useNav((s) => s.open)
	const selectedId = useProject((s) => s.selectedId)
	const sections = page?.sections

	// Reveal the selected element when it was picked on the canvas
	useEffect(() => {
		if (!sections || !selectedId) return
		const chain = ancestorsOf(sections, selectedId)
		if (chain[0]?.section?.locked === false) {
			useNav.getState().setOpen(chain.map((a) => a.id))
		}
		document
			.querySelector(`[data-nav-row="${CSS.escape(selectedId)}"]`)
			?.scrollIntoView({ block: 'nearest' })
	}, [sections, selectedId])

	if (!page || !sections) return null
	const rows = flattenVisible(sections, open)

	const onKeyDown = (e: React.KeyboardEvent) => {
		const target = e.target as HTMLElement
		if (target.closest('[role=menu], input, textarea')) return
		const at = rows.findIndex((r) => r.node.id === selectedId)
		const row = rows[at]
		const go = (id: string | undefined) => {
			if (!id) return
			e.preventDefault()
			selectAndReveal(id)
		}
		const nav = useNav.getState()
		switch (e.key) {
			case 'ArrowDown':
				go(rows[at < 0 ? 0 : at + 1]?.node.id)
				break
			case 'ArrowUp':
				go(rows[at < 0 ? 0 : at - 1]?.node.id)
				break
			case 'ArrowRight':
				if (!row || elementChildren(row.node).length === 0) break
				if (row.node.section?.locked) break
				e.preventDefault()
				if (!open[row.node.id]) nav.setOpen([row.node.id])
				else go(elementChildren(row.node)[0]?.id)
				break
			case 'ArrowLeft':
				if (!row) break
				e.preventDefault()
				if (open[row.node.id]) nav.setOpen([row.node.id], false)
				else go(row.parentId ?? undefined)
				break
			case 'Enter':
				if (row) go(row.node.id)
				break
			case 'Delete':
			case 'Backspace':
				// Section roots are removed elsewhere
				if (!row?.parentId) break
				e.preventDefault()
				e.stopPropagation()
				deleteNode(row.node.id)
				selectAndReveal(row.parentId)
				break
		}
	}

	return (
		<div
			tabIndex={0}
			onKeyDown={onKeyDown}
			className='flex w-0 min-w-full flex-col gap-0.5 p-2 outline-none'
		>
			<div className='flex items-center justify-between pb-1'>
				<span className='text-muted-foreground px-1 text-xs'>
					Structure
				</span>
				<AddMenu />
			</div>
			{page.showHeader && header && <FixedRow node={header} />}
			{sections.length === 0 && (
				<p className='text-muted-foreground p-2 text-sm'>
					No sections yet
				</p>
			)}
			{sections.map((node, i) => (
				<div key={node.id} className='flex flex-col gap-0.5'>
					<SectionRow node={node} index={i} count={sections.length} />
					{flattenVisible([node], open)
						.slice(1)
						.map((r) => (
							<ElementRow
								key={r.node.id}
								node={r.node}
								depth={r.depth}
								icon={iconKeyOf(r.node)}
							/>
						))}
				</div>
			))}
			{page.showFooter && footer && <FixedRow node={footer} />}
		</div>
	)
}
