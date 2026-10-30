import { useEffect, useRef, useState } from 'react'
import { useCanvas } from '@/editor/canvas/canvasStore'
import {
	execute,
	resolve,
	type DropView,
	type Resolved,
} from '@/editor/canvas/dropPlan'
import { elementFor } from '@/editor/canvas/frame'
import { canStartMove, passedThreshold } from '@/editor/canvas/moveDrag'
import { currentSections, nodeDrag } from '@/editor/navigator/dragHelpers'
import { useProject } from '@/store/project'

const STYLE_ID = 'editor-move-style'

// Moves the selected element by dragging it on the canvas. The frame is its own
// document, so this is a plain pointer drag whose coordinates already match
// the iframe. The same resolution and indicator as library drops apply.
export function useElementMove(scale: number, sectionIds: string) {
	const doc = useCanvas((s) => s.doc)
	const [view, setView] = useState<DropView | null>(null)
	const [moving, setMoving] = useState(false)
	const scaleRef = useRef(scale)
	const idsRef = useRef(sectionIds)
	useEffect(() => {
		scaleRef.current = scale
		idsRef.current = sectionIds
	}, [scale, sectionIds])

	useEffect(() => {
		if (!doc) return
		const win = doc.defaultView
		if (!win) return
		let press: { id: string; x: number; y: number } | null = null
		let dragging: { id: string; el: HTMLElement; saved: string } | null =
			null
		let last: Resolved | null = null

		const addStyle = () => {
			const s = doc.createElement('style')
			s.id = STYLE_ID
			s.textContent =
				'*{cursor:grabbing !important;user-select:none !important}'
			doc.head.append(s)
		}
		// The click that follows a drag must not select or edit anything
		const swallowClick = () => {
			const swallow = (ev: Event) => {
				ev.stopPropagation()
				ev.preventDefault()
			}
			doc.addEventListener('click', swallow, true)
			win.setTimeout(
				() => doc.removeEventListener('click', swallow, true),
				0
			)
		}
		const finish = () => {
			if (dragging) {
				dragging.el.style.opacity = dragging.saved
				dragging.el.style.pointerEvents = ''
				if (!dragging.el.getAttribute('style')) {
					dragging.el.removeAttribute('style')
				}
			}
			doc.getElementById(STYLE_ID)?.remove()
			dragging = null
			press = null
			last = null
			setMoving(false)
			setView(null)
		}
		const update = (e: MouseEvent) => {
			if (!dragging) return
			last = resolve(
				doc,
				{ ...nodeDrag(dragging.id) },
				idsRef.current ? idsRef.current.split(',') : [],
				e.clientX,
				e.clientY
			)
			setView(last.view)
		}

		const onDown = (e: MouseEvent) => {
			if (e.button !== 0) return
			const { selectedId, editingComponentId } = useProject.getState()
			if (!selectedId || useCanvas.getState().editingId) return
			const target = e.target as Element | null
			if (!target || target.closest('[contenteditable]')) return
			const el = elementFor(doc, selectedId)
			if (!el || !el.contains(target)) return
			const editing = Boolean(editingComponentId)
			if (!canStartMove(currentSections(), selectedId, editing)) return
			press = { id: selectedId, x: e.clientX, y: e.clientY }
		}
		const onMove = (e: MouseEvent) => {
			if (!press) return
			if (e.buttons === 0) return finish()
			if (!dragging) {
				const from = { x: press.x, y: press.y }
				const to = { x: e.clientX, y: e.clientY }
				if (!passedThreshold(from, to, scaleRef.current)) return
				const el = elementFor(doc, press.id)
				if (!el) return finish()
				dragging = { id: press.id, el, saved: el.style.opacity }
				// Dimmed, and skipped by hit testing so its own place resolves to the parent
				el.style.opacity = '0.4'
				el.style.pointerEvents = 'none'
				addStyle()
				win.getSelection()?.removeAllRanges()
				setMoving(true)
			}
			e.preventDefault()
			update(e)
		}
		const onUp = (e: MouseEvent) => {
			if (!dragging) {
				press = null
				return
			}
			update(e)
			const plan = last?.plan
			const id = dragging.id
			finish()
			swallowClick()
			if (plan) execute({ ...nodeDrag(id) }, plan)
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape' || !(press || dragging)) return
			e.stopPropagation()
			const was = Boolean(dragging)
			finish()
			if (was) swallowClick()
		}
		// Native drag of links and images would take over the pointer
		const onNative = (e: Event) => {
			if (press) e.preventDefault()
		}

		doc.addEventListener('mousedown', onDown, true)
		doc.addEventListener('mousemove', onMove, true)
		doc.addEventListener('mouseup', onUp, true)
		doc.addEventListener('dragstart', onNative, true)
		doc.addEventListener('keydown', onKey, true)
		window.addEventListener('keydown', onKey, true)
		win.addEventListener('blur', finish)
		return () => {
			doc.removeEventListener('mousedown', onDown, true)
			doc.removeEventListener('mousemove', onMove, true)
			doc.removeEventListener('mouseup', onUp, true)
			doc.removeEventListener('dragstart', onNative, true)
			doc.removeEventListener('keydown', onKey, true)
			window.removeEventListener('keydown', onKey, true)
			win.removeEventListener('blur', finish)
			finish()
		}
	}, [doc])

	return { moving, view }
}
