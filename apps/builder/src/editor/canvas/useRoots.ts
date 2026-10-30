import { useMemo } from 'react'
import type { ElementNode } from '@ui-system/core'
import { useDocument } from '@/store/document'
import { useCurrentPage, useProject } from '@/store/project'

// Everything drawn on the canvas in order: header, sections, footer.
// While a component is edited only its master is drawn
export function useRoots(): ElementNode[] {
	const page = useCurrentPage()
	const editing = useProject((s) => s.editingComponentId)
	const master = useDocument((s) =>
		editing ? (s.doc?.components[editing]?.root ?? null) : null
	)
	const header = useDocument((s) => s.doc?.partials.header ?? null)
	const footer = useDocument((s) => s.doc?.partials.footer ?? null)
	return useMemo(() => {
		if (editing) return master ? [master] : []
		if (!page) return []
		return [
			...(page.showHeader && header ? [header] : []),
			...page.sections,
			...(page.showFooter && footer ? [footer] : []),
		]
	}, [page, header, footer, editing, master])
}
