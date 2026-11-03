import { useEffect } from 'react'
import { isCurrentHref, type ElementNode } from '@ui-system/core'
import { useDocument } from '@/store/document'
import { useCurrentPage } from '@/store/project'

// Editor-only mark on links we touched, so they can be cleaned up, never saved
const MARK = 'data-editor-current'

// Links to the open page look active on the canvas, like in the export
export function useCurrentPageMark(doc: Document | null, roots: ElementNode[]) {
	const page = useCurrentPage()
	const prefix = useDocument((s) => s.doc?.site.pathPrefix)
	useEffect(() => {
		if (!doc || !page) return
		for (const el of doc.querySelectorAll(`[${MARK}]`)) {
			el.removeAttribute('aria-current')
			if (el.getAttribute(MARK) === 'menu')
				el.classList.remove('menu-active')
			el.removeAttribute(MARK)
		}
		const current = {
			file: `${page.slug}.html`,
			home: page.slug === 'index',
			prefix,
		}
		for (const a of doc.querySelectorAll('a[href]')) {
			if (!isCurrentHref(a.getAttribute('href') ?? '', current)) continue
			if (a.hasAttribute('aria-current')) continue
			a.setAttribute('aria-current', 'page')
			const menu =
				a.closest('.menu') && !a.classList.contains('menu-active')
			if (menu) a.classList.add('menu-active')
			a.setAttribute(MARK, menu ? 'menu' : '')
		}
	}, [doc, roots, page, prefix])
}
