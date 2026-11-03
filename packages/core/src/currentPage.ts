import { isElement } from './tree'
import type { ElementNode, TreeNode } from './types'

export interface CurrentPage {
	// File name of the page, like about.html
	file: string
	home: boolean
	// Asset path prefix of the site, may be empty
	prefix?: string
}

// Does a link point to the page itself, with or without the path prefix
export const isCurrentHref = (href: string, page: CurrentPage) => {
	let path = href.trim()
	if (
		!path ||
		path.startsWith('#') ||
		/^[a-z][a-z0-9+.-]*:|^\/\//i.test(path)
	)
		return false
	path = path.replace(/[?#].*$/, '')
	const prefix = (page.prefix ?? '').replace(/\/+$/, '')
	if (prefix && (path === prefix || path.startsWith(`${prefix}/`)))
		path = path.slice(prefix.length)
	path = path.replace(/^(\.\/)+/, '').replace(/^\/+/, '')
	if (path === page.file) return true
	return page.home && (path === '' || path === 'index.html')
}

const hasClass = (node: ElementNode, name: string) =>
	node.classes.split(/\s+/).includes(name)

// Marks links to the current page in place: aria-current, and menu-active inside a daisyUI menu
export const markCurrentPage = (roots: TreeNode[], page: CurrentPage) => {
	const visit = (node: TreeNode, inMenu: boolean) => {
		if (!isElement(node)) return
		const menu = inMenu || hasClass(node, 'menu')
		if (
			node.tag.toLowerCase() === 'a' &&
			isCurrentHref(node.attrs.href ?? '#', page)
		) {
			node.attrs['aria-current'] = 'page'
			if (menu && !hasClass(node, 'menu-active'))
				node.classes = `${node.classes} menu-active`.trim()
		}
		for (const child of node.children) visit(child, menu)
	}
	for (const root of roots) visit(root, false)
}
