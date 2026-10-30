import { useEffect } from 'react'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useProject } from '@/store/project'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor, PAGE_ROOT, SHELL_ATTR } from '@/editor/canvas/frame'

const THRESHOLD = 8

// Same rule as the exported site: hide when scrolling down past the header,
// show when scrolling up. Never hides while something keeps it needed
export const shouldHide = (
	last: number,
	y: number,
	headerHeight: number,
	keepVisible: boolean
) => !keepVisible && y > last && y > headerHeight

export const movedEnough = (last: number, y: number) =>
	Math.abs(y - last) >= THRESHOLD

// Slides the canvas header out on scrolling down, as the exported site does.
// It stays while the header or something in it is selected or edited, or during a drag
export function useCanvasAutohide() {
	const doc = useCanvas((s) => s.doc)
	useEffect(() => {
		const win = doc?.defaultView
		if (!doc || !win) return
		let dragging = false
		let last = win.scrollY
		const header = () =>
			doc.querySelector<HTMLElement>(
				`#${PAGE_ROOT}[data-header="autohide"] > [${SHELL_ATTR}="header"]`
			)
		const keepVisible = (el: HTMLElement) => {
			if (dragging) return true
			const { selectedId } = useProject.getState()
			const { editingId } = useCanvas.getState()
			return [selectedId, editingId].some((id) => {
				if (!id) return false
				const node = elementFor(doc, id)
				return !!node && el.contains(node)
			})
		}
		const show = () => {
			const el = header()
			if (el) el.style.transform = ''
		}
		const onScroll = () => {
			const el = header()
			const y = Math.max(0, win.scrollY)
			if (!el) {
				last = y
				return
			}
			if (!movedEnough(last, y)) return
			const hide = shouldHide(last, y, el.offsetHeight, keepVisible(el))
			el.style.transform = hide ? 'translateY(-100%)' : ''
			last = y
		}
		// Selecting or editing inside the header brings it back
		const sync = () => {
			const el = header()
			if (el && keepVisible(el)) show()
		}
		win.addEventListener('scroll', onScroll, { passive: true })
		const unsubProject = useProject.subscribe(sync)
		const unsubCanvas = useCanvas.subscribe(sync)
		const unsubDrag = monitorForElements({
			onDragStart: () => {
				dragging = true
				show()
			},
			onDrop: () => {
				dragging = false
			},
		})
		return () => {
			win.removeEventListener('scroll', onScroll)
			unsubProject()
			unsubCanvas()
			unsubDrag()
			show()
		}
	}, [doc])
}
