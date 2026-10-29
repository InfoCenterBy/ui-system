import { useEffect } from 'react'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { deleteSelected } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const isTyping = (target: EventTarget | null) => {
	const el = target as HTMLElement | null
	return Boolean(
		el?.closest?.('input, textarea, select, [contenteditable="true"]')
	)
}

// Undo, redo, delete and escape work in the editor and inside the canvas
export function useShortcuts() {
	const doc = useCanvas((s) => s.doc)

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey
			const key = e.key.toLowerCase()
			if (mod && (key === 'z' || key === 'y') && !isTyping(e.target)) {
				e.preventDefault()
				const { undo, redo } = useDocument.getState()
				if (key === 'y' || e.shiftKey) redo()
				else undo()
				return
			}
			if (isTyping(e.target)) return
			const { selectedId, select } = useProject.getState()
			if (key === 'escape') select(null)
			if ((key === 'delete' || key === 'backspace') && selectedId) {
				e.preventDefault()
				deleteSelected()
			}
		}
		const targets: (Window | Document)[] = [window]
		if (doc) targets.push(doc)
		targets.forEach((t) =>
			t.addEventListener('keydown', onKey as EventListener)
		)
		return () =>
			targets.forEach((t) =>
				t.removeEventListener('keydown', onKey as EventListener)
			)
	}, [doc])
}
