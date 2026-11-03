import {
	cloneNode,
	isElement,
	locate,
	randomId,
	walk,
	type ElementNode,
	type TreeNode,
} from '@ui-system/core'
import type { Doc } from '@/store/history'

const pageHref = (slug: string) => `${slug}.html`

// The header menu lists the site pages in order, called inside an edit
export const fillMenuDraft = (draft: Doc) => {
	const header = draft.partials.header
	if (!header) return
	// One template per sibling list: a header may hold a desktop and a mobile menu
	const templates: ElementNode[] = []
	const lists = new Set<TreeNode[]>()
	walk([header], (node) => {
		if (!isElement(node) || !node.repeat) return
		const at = locate([header], node.id)
		if (!at || lists.has(at.list)) return
		lists.add(at.list)
		templates.push(node)
		return false
	})
	for (const template of templates) {
		const at = locate([header], template.id)
		if (!at) continue
		const group = template.repeat
		const items = draft.site.pages.flatMap((id) => {
			const page = draft.pages[id]
			if (!page) return []
			const item = cloneNode(template, randomId)
			walk([item], (node) => {
				if (isElement(node) && node.slot === 'link') {
					node.attrs.href = pageHref(page.slug)
					node.children = [
						{ id: randomId(), type: 'text', text: page.name },
					]
				}
			})
			return [item]
		})
		// Old items of the group are replaced in place by the page links
		const insertAt = at.list.findIndex(
			(node) => isElement(node) && node.repeat === group
		)
		const kept = at.list.filter(
			(node) => !(isElement(node) && node.repeat === group)
		)
		at.list.splice(0, at.list.length, ...kept)
		at.list.splice(insertAt, 0, ...items)
	}
}
