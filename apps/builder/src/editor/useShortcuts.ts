import { useEffect } from 'react'
import { toast } from 'sonner'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { t } from '@/i18n'
import { deleteSelected } from '@/store/actions'
import { flushSave } from '@/store/autosave'
import {
	copySelected,
	cutSelected,
	duplicateSelected,
	pasteClip,
} from '@/store/clipboardActions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'
import { useUi } from '@/store/ui'

const isTyping = (target: EventTarget | null) => {
	const el = target as HTMLElement | null
	return Boolean(
		el?.closest?.('input, textarea, select, [contenteditable="true"]')
	)
}

// Native copy and paste win when text is selected or being edited
const nativeClipboard = (target: EventTarget | null) => {
	if (isTyping(target)) return true
	const doc = (target as Node | null)?.ownerDocument ?? document
	return Boolean(doc.getSelection()?.toString())
}

export const saveNow = async () => {
	try {
		await flushSave()
		toast.success(t('speed.saved'), { id: 'saved', duration: 1200 })
	} catch (e) {
		toast.error((e as Error).message)
	}
}

// Undo, redo, delete, escape, save, clipboard, preview and the palette work in
// the editor and inside the canvas. Preview is Alt+P, Ctrl+Shift+P is taken by
// the browser print dialog
export function useShortcuts() {
	const doc = useCanvas((s) => s.doc)

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey
			const key = e.key.toLowerCase()
			const { preview, setPreview, setPalette } = useUi.getState()
			if (mod && key === 's') {
				e.preventDefault()
				void saveNow()
				return
			}
			if (mod && key === 'k') {
				e.preventDefault()
				setPalette(!useUi.getState().palette)
				return
			}
			if (e.altKey && !mod && e.code === 'KeyP') {
				e.preventDefault()
				setPreview(!preview)
				return
			}
			if (preview) {
				if (key === 'escape') setPreview(false)
				return
			}
			if (mod && (key === 'z' || key === 'y') && !isTyping(e.target)) {
				e.preventDefault()
				const { undo, redo } = useDocument.getState()
				if (key === 'y' || e.shiftKey) redo()
				else undo()
				return
			}
			if (isTyping(e.target)) return
			if (mod && key === 'd') {
				e.preventDefault()
				duplicateSelected()
				return
			}
			const { selectedId, select, editingComponentId, exitComponent } =
				useProject.getState()
			if (key === 'escape') {
				if (editingComponentId) exitComponent()
				else select(null)
			}
			if ((key === 'delete' || key === 'backspace') && selectedId) {
				e.preventDefault()
				deleteSelected()
			}
		}
		// Clipboard events carry the data themselves, no permission prompt
		const onCopy = (e: ClipboardEvent) => {
			if (useUi.getState().preview || nativeClipboard(e.target)) return
			if (!useProject.getState().selectedId) return
			e.preventDefault()
			if (e.type === 'cut') cutSelected(e.clipboardData)
			else copySelected(e.clipboardData)
		}
		const onPaste = (e: ClipboardEvent) => {
			if (useUi.getState().preview || isTyping(e.target)) return
			e.preventDefault()
			void pasteClip(e.clipboardData?.getData('text/plain') ?? null)
		}
		const targets: (Window | Document)[] = [window]
		if (doc) targets.push(doc)
		targets.forEach((target) => {
			target.addEventListener('keydown', onKey as EventListener)
			target.addEventListener('copy', onCopy as EventListener)
			target.addEventListener('cut', onCopy as EventListener)
			target.addEventListener('paste', onPaste as EventListener)
		})
		return () =>
			targets.forEach((target) => {
				target.removeEventListener('keydown', onKey as EventListener)
				target.removeEventListener('copy', onCopy as EventListener)
				target.removeEventListener('cut', onCopy as EventListener)
				target.removeEventListener('paste', onPaste as EventListener)
			})
	}, [doc])
}
