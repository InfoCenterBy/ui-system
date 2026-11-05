import { useEffect, useState } from 'react'
import { MoveIcon } from 'lucide-react'
import { findElement, locate, type ElementNode } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import {
	areaOf,
	gapCells,
	spanTo,
	startAt,
	trackEnd,
	trackIndexAt,
	withSpan,
	withStart,
	type Axis,
} from '@/editor/canvas/gridMath'
import { readGrid, type GridInfo } from '@/editor/canvas/gridRead'
import { scopeOf } from '@/editor/canvas/nodes'
import { useRoots } from '@/editor/canvas/useRoots'
import { useStyleTarget } from '@/editor/style/target'
import { t } from '@/i18n'
import { setClasses } from '@/store/actions'
import { useProject } from '@/store/project'

type Mode = 'x' | 'y' | 'xy' | 'move'
type Area = { start: number; span: number }
type Placement = { col: Area; row: Area }

// Shared mutable state of the handlers; setters keep render code free of direct writes
class Live {
	drag: Drag | null = null
	roots: ElementNode[]
	root: HTMLDivElement | null = null
	constructor(roots: ElementNode[]) {
		this.roots = roots
	}
	setDrag(drag: Drag | null) {
		this.drag = drag
	}
	setNext(next: Placement) {
		if (this.drag) this.drag.next = next
	}
	setRoots(roots: ElementNode[]) {
		this.roots = roots
	}
	setRoot(root: HTMLDivElement | null) {
		this.root = root
	}
}

interface Drag {
	mode: Mode
	id: string
	el: HTMLElement
	grid: GridInfo
	area: Placement
	next: Placement
	grab: { col: number; row: number }
	style: string | null
}

const COLOR = '217 70 239'

// Puts the item's inline style back after the live preview
const restore = (d: Drag) => {
	if (d.style === null) d.el.removeAttribute('style')
	else d.el.setAttribute('style', d.style)
}

// Keeps the preview until the new class reaches the canvas, so the item does not jump back
const restoreAfterSync = (d: Drag) => {
	const win = d.el.ownerDocument.defaultView
	if (!win) return restore(d)
	const observer = new win.MutationObserver(() => done())
	const done = () => {
		observer.disconnect()
		restore(d)
	}
	observer.observe(d.el, { attributes: true, attributeFilter: ['class'] })
	win.setTimeout(done, 300)
}

// Grid tracks, gaps and numbers of one grid element
function GridLines({
	grid,
	scale,
	strong,
}: {
	grid: GridInfo
	scale: number
	strong: boolean
}) {
	const { cols, rows } = grid
	const top = rows[0].start
	const left = cols[0].start
	const width = trackEnd(cols) - left
	const height = trackEnd(rows) - top
	const line = `${1 / scale}px dashed rgb(${COLOR} / ${strong ? 0.8 : 0.4})`
	const hatch = `repeating-linear-gradient(45deg, rgb(${COLOR} / 0.28) 0 ${2 / scale}px, transparent ${2 / scale}px ${6 / scale}px)`
	const chipSize = 14 / scale
	const chip = (key: string, n: number, x: number, y: number) => (
		<span
			key={key}
			className='absolute rounded-sm text-center font-sans leading-none font-medium text-white'
			style={{
				left: x,
				top: y,
				minWidth: chipSize,
				padding: `${2 / scale}px ${3 / scale}px`,
				fontSize: 10 / scale,
				background: `rgb(${COLOR})`,
			}}
		>
			{n}
		</span>
	)
	// Numbers sit outside the grid, columns above and rows to the left, inside when there is no room
	const chipTop = top - chipSize - 3 / scale
	const colChipY = chipTop >= 0 ? chipTop : top + 2 / scale
	const rowChipX = left - chipSize - 3 / scale
	return (
		<>
			{cols.map((c, i) => (
				<div
					key={`c${i}`}
					className='absolute'
					style={{
						left: c.start,
						top,
						width: c.size,
						height,
						borderLeft: line,
						borderRight: line,
					}}
				/>
			))}
			{rows.map((r, i) => (
				<div
					key={`r${i}`}
					className='absolute'
					style={{
						left,
						top: r.start,
						width,
						height: r.size,
						borderTop: line,
						borderBottom: line,
					}}
				/>
			))}
			{gapCells(grid).map((cell) => (
				<div
					key={`${cell.left}:${cell.top}`}
					className='absolute'
					style={{
						left: cell.left,
						top: cell.top,
						width: cell.right - cell.left,
						height: cell.bottom - cell.top,
						background: hatch,
					}}
				/>
			))}
			{strong &&
				cols.map((c, i) =>
					chip(
						`cn${i}`,
						i + 1,
						c.start + c.size / 2 - chipSize / 2,
						colChipY
					)
				)}
			{strong &&
				rows.map((r, i) =>
					chip(
						`rn${i}`,
						i + 1,
						rowChipX >= 0 ? rowChipX : left + 2 / scale,
						r.start + r.size / 2 - chipSize / 2
					)
				)}
		</>
	)
}

const cursors: Record<Mode, string> = {
	x: 'ew-resize',
	y: 'ns-resize',
	xy: 'nwse-resize',
	move: 'move',
}

// Grid lines for a selected grid or grid item, and handles to size or place the item.
// Handles: right edge, bottom edge and corner set col-span and row-span, the grip in
// the top right corner moves the item to another cell (col-start and row-start).
// The body drag keeps reordering elements as before.
export function GridOverlay({
	scale,
	selectedId,
}: {
	scale: number
	selectedId: string | null
}) {
	const doc = useCanvas((s) => s.doc)
	const roots = useRoots()
	const editing = useProject((s) => s.editingComponentId)
	// Not refs: handlers are built during render, this is just their shared mutable state
	const [live] = useState(() => new Live(roots))
	const [label, setLabel] = useState<string | null>(null)
	useEffect(() => {
		live.setRoots(roots)
	}, [roots, live])
	// A drag still in flight when the selection or canvas goes away is dropped
	useEffect(
		() => () => {
			if (live.drag) restore(live.drag)
			live.setDrag(null)
		},
		[selectedId, doc, live]
	)

	const cancel = () => {
		if (live.drag) restore(live.drag)
		live.setDrag(null)
		setLabel(null)
	}

	if (!doc || !selectedId) return null
	const el = elementFor(doc, selectedId)
	if (!el) return null
	const at = locate(roots, selectedId)
	const parentEl = at?.parent ? elementFor(doc, at.parent.id) : null
	const own = readGrid(el)
	const parent = parentEl ? readGrid(parentEl) : null
	if (!own && !parent) return null
	const position = doc.defaultView?.getComputedStyle(el).position
	const item =
		parent !== null && position !== 'absolute' && position !== 'fixed'
	const editable =
		item &&
		at?.parent != null &&
		scopeOf(roots, selectedId, Boolean(editing)) === 'free'
	const box = el.getBoundingClientRect()

	const toFrame = (e: { clientX: number; clientY: number }) => {
		const r = live.root?.getBoundingClientRect()
		return {
			x: (e.clientX - (r?.left ?? 0)) / scale,
			y: (e.clientY - (r?.top ?? 0)) / scale,
		}
	}

	const apply = (d: Drag) => {
		const s = d.el.style
		const win = d.el.ownerDocument.defaultView
		const computed = win?.getComputedStyle(d.el)
		const start = (axis: Axis) => {
			const value =
				(axis === 'col'
					? computed?.gridColumnStart
					: computed?.gridRowStart) ?? 'auto'
			return /^-?\d+$/.test(value) ? value : 'auto'
		}
		if (d.mode === 'move') {
			s.gridColumnStart = String(d.next.col.start + 1)
			s.gridRowStart = String(d.next.row.start + 1)
			return
		}
		if (d.mode !== 'y') {
			s.gridColumn = `${start('col')} / span ${d.next.col.span}`
		}
		if (d.mode !== 'x') {
			s.gridRow = `${start('row')} / span ${d.next.row.span}`
		}
	}

	const nextFor = (d: Drag, x: number, y: number): Placement => {
		const { cols, rows } = d.grid
		if (d.mode === 'move') {
			return {
				col: {
					start: startAt(cols, x, d.grab.col, d.area.col.span),
					span: d.area.col.span,
				},
				row: {
					start: startAt(rows, y, d.grab.row, d.area.row.span),
					span: d.area.row.span,
				},
			}
		}
		return {
			col:
				d.mode === 'y'
					? d.area.col
					: {
							start: d.area.col.start,
							span: spanTo(cols, d.area.col.start, x),
						},
			row:
				d.mode === 'x'
					? d.area.row
					: {
							start: d.area.row.start,
							span: spanTo(rows, d.area.row.start, y),
						},
		}
	}

	const describe = (d: Drag) => {
		const bp = useStyleTarget.getState().target
		const prefix = bp ? `${bp}:` : ''
		if (d.mode === 'move') {
			return `${prefix}col-start-${d.next.col.start + 1} ${prefix}row-start-${d.next.row.start + 1}`
		}
		const parts: string[] = []
		if (d.mode !== 'y') parts.push(`${prefix}col-span-${d.next.col.span}`)
		if (d.mode !== 'x') parts.push(`${prefix}row-span-${d.next.row.span}`)
		return parts.join(' ')
	}

	const begin = (mode: Mode) => (e: React.PointerEvent<HTMLElement>) => {
		if (e.button !== 0 || !parent) return
		e.preventDefault()
		e.stopPropagation()
		e.currentTarget.setPointerCapture(e.pointerId)
		const r = el.getBoundingClientRect()
		const area = {
			col: areaOf(parent.cols, r.left, r.right),
			row: areaOf(parent.rows, r.top, r.bottom),
		}
		const p = toFrame(e)
		const held = (axis: Axis, pos: number) =>
			Math.max(
				0,
				Math.min(
					trackIndexAt(
						axis === 'col' ? parent.cols : parent.rows,
						pos
					) - area[axis].start,
					area[axis].span - 1
				)
			)
		const d: Drag = {
			mode,
			id: selectedId,
			el,
			grid: parent,
			area,
			next: area,
			grab: { col: held('col', p.x), row: held('row', p.y) },
			style: el.getAttribute('style'),
		}
		live.setDrag(d)
		setLabel(describe(d))
		const onKey = (ev: KeyboardEvent) => {
			if (ev.key !== 'Escape') return
			ev.stopPropagation()
			window.removeEventListener('keydown', onKey, true)
			cancel()
		}
		window.addEventListener('keydown', onKey, true)
		e.currentTarget.addEventListener(
			'lostpointercapture',
			() => window.removeEventListener('keydown', onKey, true),
			{ once: true }
		)
	}

	const move = (e: React.PointerEvent) => {
		const d = live.drag
		if (!d) return
		const p = toFrame(e)
		live.setNext(nextFor(d, p.x, p.y))
		apply(d)
		setLabel(describe(d))
	}

	const end = (e: React.PointerEvent) => {
		const d = live.drag
		if (!d) return
		const p = toFrame(e)
		live.setNext(nextFor(d, p.x, p.y))
		live.setDrag(null)
		setLabel(null)
		const same =
			d.next.col.start === d.area.col.start &&
			d.next.col.span === d.area.col.span &&
			d.next.row.start === d.area.row.start &&
			d.next.row.span === d.area.row.span
		const classes0 = same
			? undefined
			: findElement(live.roots, d.id)?.classes
		if (classes0 === undefined) return restore(d)
		let classes = classes0
		const bp = useStyleTarget.getState().target
		if (d.mode === 'move') {
			classes = withStart(classes, 'col', bp, d.next.col.start)
			classes = withStart(classes, 'row', bp, d.next.row.start)
		} else {
			if (d.mode !== 'y')
				classes = withSpan(classes, 'col', bp, d.next.col.span)
			if (d.mode !== 'x')
				classes = withSpan(classes, 'row', bp, d.next.row.span)
		}
		setClasses(d.id, classes)
		restoreAfterSync(d)
	}

	const size = 10 / scale
	const handle = (mode: Mode, x: number, y: number, title: string) => (
		<span
			role='button'
			aria-label={title}
			title={title}
			onPointerDown={begin(mode)}
			onPointerMove={move}
			onPointerUp={end}
			onPointerCancel={cancel}
			className='pointer-events-auto absolute touch-none rounded-sm border border-white'
			style={{
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				cursor: cursors[mode],
				background: `rgb(${COLOR})`,
				borderWidth: 1 / scale,
			}}
		/>
	)
	const grip = 16 / scale

	return (
		<div
			ref={(node) => {
				live.setRoot(node)
			}}
			className='pointer-events-none absolute inset-0'
		>
			{parent && <GridLines grid={parent} scale={scale} strong />}
			{own && <GridLines grid={own} scale={scale} strong={!parent} />}
			{editable && (
				<>
					{handle(
						'x',
						box.right,
						box.top + box.height / 2,
						t('grid.resizeWidth')
					)}
					{handle(
						'y',
						box.left + box.width / 2,
						box.bottom,
						t('grid.resizeHeight')
					)}
					{handle('xy', box.right, box.bottom, t('grid.resizeBoth'))}
					<span
						role='button'
						aria-label={t('grid.place')}
						title={t('grid.place')}
						onPointerDown={begin('move')}
						onPointerMove={move}
						onPointerUp={end}
						onPointerCancel={cancel}
						className='pointer-events-auto absolute flex touch-none items-center justify-center rounded-sm text-white'
						style={{
							left: box.right - grip - 4 / scale,
							top: box.top + 4 / scale,
							width: grip,
							height: grip,
							cursor: 'move',
							background: `rgb(${COLOR})`,
						}}
					>
						<MoveIcon
							style={{ width: grip * 0.7, height: grip * 0.7 }}
						/>
					</span>
				</>
			)}
			{label && (
				<span
					className='absolute rounded-sm bg-black/80 font-mono whitespace-nowrap text-white'
					style={{
						left: box.left,
						top: box.bottom + 6 / scale,
						padding: `${2 / scale}px ${5 / scale}px`,
						fontSize: 11 / scale,
					}}
				>
					{label}
				</span>
			)}
		</div>
	)
}
