import { useEffect, type RefObject } from 'react'
import { findElement, type ElementNode } from '@ui-system/core'
import { elementFor, nodeIdAt } from '@/editor/canvas/frame'
import { startInlineEdit, stopInlineEdit } from '@/editor/canvas/inlineEdit'
import { isInlineEditable } from '@/editor/canvas/inlineSchema'
import { pickTarget } from '@/editor/canvas/nodes'
import { useProject } from '@/store/project'

// Double-click on a text slot edits it in place, leaving the page or selection ends it
export function useInlineEditing(
	doc: Document | null,
	rootsRef: RefObject<ElementNode[]>
) {
	useEffect(() => {
		if (!doc) return
		const onDoubleClick = (e: MouseEvent) => {
			const roots = rootsRef.current
			const id = pickTarget(roots, nodeIdAt(e.target))
			const node = id ? findElement(roots, id) : null
			const el = id ? elementFor(doc, id) : null
			if (!id || !node || !el || !isInlineEditable(node.slot)) return
			e.preventDefault()
			useProject.getState().select(id)
			startInlineEdit(el, id, node.slot!)
		}
		doc.addEventListener('dblclick', onDoubleClick)
		return () => {
			doc.removeEventListener('dblclick', onDoubleClick)
			stopInlineEdit()
		}
	}, [doc, rootsRef])

	const pageId = useProject((s) => s.currentPageId)
	useEffect(() => () => stopInlineEdit(), [pageId])
}
