import { useMemo } from 'react'
import type { ElementNode } from '@ui-system/core'
import { useDocument } from '@/store/document'
import { useCurrentPage } from '@/store/project'

// Everything drawn on the canvas in order: header, sections, footer
export function useRoots(): ElementNode[] {
	const page = useCurrentPage()
	const header = useDocument((s) => s.doc?.partials.header ?? null)
	const footer = useDocument((s) => s.doc?.partials.footer ?? null)
	return useMemo(() => {
		if (!page) return []
		return [
			...(page.showHeader && header ? [header] : []),
			...page.sections,
			...(page.showFooter && footer ? [footer] : []),
		]
	}, [page, header, footer])
}
