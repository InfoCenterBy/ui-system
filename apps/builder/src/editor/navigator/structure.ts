import { isElement, type ElementNode, type TreeNode } from '@ui-system/core'

const VOID_TAGS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'track',
	'wbr',
])

const TEXT_TAGS = new Set([
	'a',
	'b',
	'blockquote',
	'button',
	'em',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'i',
	'label',
	'p',
	'span',
	'strong',
])

export type IconKey =
	'heading' | 'text' | 'image' | 'link' | 'button' | 'list' | 'container'

export const isVoid = (node: ElementNode) =>
	VOID_TAGS.has(node.tag.toLowerCase())

// Whether other elements can be dropped or inserted inside
export const canContain = (node: ElementNode) => {
	const tag = node.tag.toLowerCase()
	if (VOID_TAGS.has(tag) || TEXT_TAGS.has(tag)) return false
	return !node.children.some(
		(child) => child.type === 'text' && child.text.trim() !== ''
	)
}

export const iconKeyOf = (node: ElementNode): IconKey => {
	const tag = node.tag.toLowerCase()
	if (/^h[1-6]$/.test(tag)) return 'heading'
	if (tag === 'img' || tag === 'picture' || tag === 'svg') return 'image'
	if (tag === 'a') return 'link'
	if (tag === 'button') return 'button'
	if (tag === 'ul' || tag === 'ol' || tag === 'li') return 'list'
	if (tag === 'p' || tag === 'span' || tag === 'label') return 'text'
	return 'container'
}

const textOf = (nodes: TreeNode[]): string =>
	nodes
		.map((n) => (n.type === 'text' ? n.text : textOf(n.children)))
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim()

const PREVIEW_MAX = 24

// Short hint after the tag name: first class, or a text preview for text-like nodes
export const hintOf = (node: ElementNode) => {
	const text = textOf(node.children)
	if (text && !canContain(node)) {
		return text.length > PREVIEW_MAX
			? `${text.slice(0, PREVIEW_MAX)}…`
			: text
	}
	const first = node.classes.split(/\s+/).find(Boolean)
	return first ?? ''
}

// Elements shown as rows, text nodes are skipped
export const elementChildren = (node: ElementNode) =>
	node.children.filter(isElement)

export interface VisibleRow {
	node: ElementNode
	parentId: string | null
	depth: number
}

// Rows in display order: unlocked sections list their elements while open
export const flattenVisible = (
	sections: ElementNode[],
	open: Record<string, boolean>
): VisibleRow[] => {
	const rows: VisibleRow[] = []
	const visit = (
		node: ElementNode,
		parentId: string | null,
		depth: number
	) => {
		rows.push({ node, parentId, depth })
		if (!open[node.id]) return
		for (const child of elementChildren(node))
			visit(child, node.id, depth + 1)
	}
	for (const section of sections) {
		rows.push({ node: section, parentId: null, depth: 0 })
		if (section.section?.locked || !open[section.id]) continue
		for (const child of elementChildren(section))
			visit(child, section.id, 1)
	}
	return rows
}
