import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
	Box,
	ChevronDown,
	ChevronRight,
	Heading,
	Image,
	Link,
	List,
	MousePointerClick,
	Type,
} from 'lucide-react'
import type { ElementNode } from '@ui-system/core'
import {
	draggable,
	dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import { labelOf } from '@/editor/canvas/nodes'
import { useProject } from '@/store/project'
import { asNode, canDropNode, dropNode, nodeDrag } from './dragHelpers'
import { zoneAt, type Zone } from './dropPosition'
import { useNav } from './navState'
import { RowMenu } from './RowMenu'
import { canContain, elementChildren, hintOf, type IconKey } from './structure'

const ICONS: Record<IconKey, ReactNode> = {
	heading: <Heading />,
	text: <Type />,
	image: <Image />,
	link: <Link />,
	button: <MousePointerClick />,
	list: <List />,
	container: <Box />,
}

export const selectAndReveal = (id: string) => {
	useProject.getState().select(id)
	const doc = useCanvas.getState().doc
	if (doc) elementFor(doc, id)?.scrollIntoView({ block: 'nearest' })
}

interface Props {
	node: ElementNode
	depth: number
	icon: IconKey
}

export function ElementRow({ node, depth, icon }: Props) {
	const ref = useRef<HTMLDivElement>(null)
	const nodeRef = useRef(node)
	useEffect(() => {
		nodeRef.current = node
	})
	const [zone, setZone] = useState<Zone | null>(null)
	const [dragging, setDragging] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const selected = useProject((s) => s.selectedId === node.id)
	const open = useNav((s) => Boolean(s.open[node.id]))
	const toggle = useNav((s) => s.toggle)
	const hover = useProject((s) => s.hover)
	const id = node.id
	const expandable = elementChildren(node).length > 0
	const hint = hintOf(node)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		const zoneFor = (y: number) => {
			const r = el.getBoundingClientRect()
			return zoneAt(y, r.top, r.height, canContain(nodeRef.current))
		}
		const stopDrag = draggable({
			element: el,
			getInitialData: () => ({ ...nodeDrag(id) }),
			onDragStart: () => setDragging(true),
			onDrop: () => setDragging(false),
		})
		const stopDrop = dropTargetForElements({
			element: el,
			canDrop: ({ source }) => {
				const drag = asNode(source.data)
				return drag !== null && canDropNode(drag.id, id)
			},
			onDrag: ({ location }) =>
				setZone(zoneFor(location.current.input.clientY)),
			onDragLeave: () => setZone(null),
			onDrop: ({ source, location }) => {
				setZone(null)
				const drag = asNode(source.data)
				if (drag) {
					dropNode(
						drag.id,
						id,
						zoneFor(location.current.input.clientY)
					)
				}
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
			data-nav-row={id}
			onMouseEnter={() => hover(id)}
			onMouseLeave={() => hover(null)}
			onContextMenu={(e) => {
				e.preventDefault()
				selectAndReveal(id)
				setMenuOpen(true)
			}}
			style={{ paddingLeft: depth * 12 + 4 }}
			className={`group/row relative flex h-7 items-center gap-1 rounded-md pr-1 text-sm ${selected ? 'bg-accent' : 'hover:bg-accent/50'} ${zone === 'inside' ? 'ring-1 ring-blue-500 ring-inset' : ''} ${dragging ? 'opacity-50' : ''}`}
		>
			<button
				type='button'
				tabIndex={-1}
				aria-label={open ? 'Collapse' : 'Expand'}
				className={`text-muted-foreground flex size-4 shrink-0 items-center justify-center outline-none [&_svg]:size-3.5 ${expandable ? '' : 'invisible'}`}
				onClick={() => toggle(id)}
			>
				{open ? <ChevronDown /> : <ChevronRight />}
			</button>
			<button
				type='button'
				tabIndex={-1}
				className='flex min-w-0 flex-1 cursor-grab items-center gap-1.5 text-left outline-none [&_svg]:size-3.5 [&_svg]:shrink-0'
				onClick={() => selectAndReveal(id)}
			>
				{ICONS[icon]}
				<span className='shrink-0'>{labelOf(node)}</span>
				{hint && (
					<span className='text-muted-foreground truncate text-xs'>
						{hint}
					</span>
				)}
			</button>
			<RowMenu id={id} open={menuOpen} onOpenChange={setMenuOpen} />
			{(zone === 'before' || zone === 'after') && (
				<div
					className={`pointer-events-none absolute right-0 left-0 h-0.5 bg-blue-500 ${zone === 'before' ? '-top-px' : '-bottom-px'}`}
				/>
			)}
		</div>
	)
}
