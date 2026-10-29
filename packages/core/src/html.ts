import { parseDocument } from 'htmlparser2'
import { type ChildNode, isTag, isText } from 'domhandler'
import { randomId, type IdFactory } from './ids'
import type { ElementNode, SectionPreset, SlotKind, TreeNode } from './types'

const SLOT_KINDS: SlotKind[] = ['text', 'rich', 'image', 'link']

// Builder markers in section HTML, they never reach the export
const EDIT_ATTR = 'data-edit'
const REPEAT_ATTR = 'data-repeat'

const RAW_TEXT = new Set(['script', 'style'])
const KEEP_WHITESPACE = new Set(['pre', 'textarea', 'script', 'style'])

const VOID = new Set([
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

const BOOLEAN_ATTRS = new Set([
	'allowfullscreen',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'inert',
	'itemscope',
	'loop',
	'multiple',
	'muted',
	'novalidate',
	'open',
	'playsinline',
	'popover',
	'readonly',
	'required',
	'reversed',
	'selected',
])

// Children of these go on their own lines, anything else keeps inline spacing
const BLOCK = new Set([
	'address',
	'article',
	'aside',
	'blockquote',
	'body',
	'details',
	'dialog',
	'div',
	'dl',
	'dd',
	'dt',
	'fieldset',
	'figcaption',
	'figure',
	'footer',
	'form',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'head',
	'header',
	'hr',
	'html',
	'li',
	'main',
	'nav',
	'ol',
	'p',
	'section',
	'summary',
	'table',
	'tbody',
	'td',
	'tfoot',
	'th',
	'thead',
	'tr',
	'ul',
])

const normalizeClasses = (value: string) =>
	value.trim().split(/\s+/).filter(Boolean).join(' ')

// Spaces at the edges of a block do not render, trimming keeps edited text clean
const trimEdges = (children: TreeNode[]) => {
	const first = children[0]
	if (first?.type === 'text') first.text = first.text.trimStart()
	const last = children.at(-1)
	if (last?.type === 'text') last.text = last.text.trimEnd()
	return children.filter((child) => child.type !== 'text' || child.text)
}

const toTree = (
	nodes: ChildNode[],
	newId: IdFactory,
	keepWhitespace: boolean
): TreeNode[] => {
	const result: TreeNode[] = []
	for (const node of nodes) {
		if (isText(node)) {
			// Indentation between tags is formatting, not content
			if (
				!keepWhitespace &&
				/^\s*$/.test(node.data) &&
				node.data.includes('\n')
			)
				continue
			const text = keepWhitespace
				? node.data
				: node.data.replace(/\s+/g, ' ')
			result.push({ id: newId(), type: 'text', text })
			continue
		}
		if (!isTag(node)) continue
		const tag = node.name.toLowerCase()
		const keep = keepWhitespace || KEEP_WHITESPACE.has(tag)
		// Parents get their id first so ids follow document order
		const id = newId()
		const children = toTree(node.children, newId, keep)
		const {
			class: classes = '',
			[EDIT_ATTR]: edit,
			[REPEAT_ATTR]: repeat,
			...attrs
		} = node.attribs
		const element: ElementNode = {
			id,
			type: 'element',
			tag: node.name,
			classes: normalizeClasses(classes),
			attrs,
			children: !keep && BLOCK.has(tag) ? trimEdges(children) : children,
		}
		if (edit !== undefined) {
			if (!SLOT_KINDS.includes(edit as SlotKind)) {
				throw new Error(
					`Unknown ${EDIT_ATTR}="${edit}" on <${node.name}>`
				)
			}
			element.slot = edit as SlotKind
		}
		if (repeat !== undefined) element.repeat = repeat || 'item'
		result.push(element)
	}
	return result
}

export const parseHtml = (
	html: string,
	newId: IdFactory = randomId
): TreeNode[] => {
	const doc = parseDocument(html, {
		lowerCaseTags: false,
		lowerCaseAttributeNames: false,
		recognizeSelfClosing: true,
	})
	return toTree(doc.children, newId, false)
}

// A preset becomes one locked section element
export const parseSection = (
	preset: SectionPreset,
	newId: IdFactory = randomId
) => {
	const roots = parseHtml(preset.html, newId).filter(
		(node) => node.type === 'element' || node.text.trim()
	)
	const [root] = roots
	if (roots.length !== 1 || root.type !== 'element') {
		throw new Error(
			`Section "${preset.id}" must have exactly one root element`
		)
	}
	root.section = { preset: preset.id, locked: true }
	return root
}

const escapeText = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeAttr = (value: string) =>
	value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export interface SerializeOptions {
	// Keep data-edit and data-repeat, for section presets
	markers?: boolean
	// One element per line with indentation where it does not change rendering
	pretty?: boolean
	indent?: string
	// Adds data-node-id so the canvas can map DOM elements back to the tree
	nodeIds?: boolean
}

export const NODE_ID_ATTR = 'data-node-id'

const attributes = (node: ElementNode, markers: boolean, nodeIds: boolean) => {
	const entries: [string, string][] = []
	if (nodeIds) entries.push([NODE_ID_ATTR, node.id])
	if (node.classes) entries.push(['class', node.classes])
	entries.push(...Object.entries(node.attrs))
	if (markers && node.slot) entries.push([EDIT_ATTR, node.slot])
	if (markers && node.repeat)
		entries.push([REPEAT_ATTR, node.repeat === 'item' ? '' : node.repeat])
	return entries
		.map(([name, value]) =>
			value === '' && (BOOLEAN_ATTRS.has(name) || name === REPEAT_ATTR)
				? ` ${name}`
				: ` ${name}="${escapeAttr(value)}"`
		)
		.join('')
}

const isBlockList = (children: TreeNode[]) =>
	children.length > 0 &&
	children.every(
		(child) =>
			child.type === 'element' && BLOCK.has(child.tag.toLowerCase())
	)

export const serializeHtml = (
	nodes: TreeNode[],
	options: SerializeOptions = {}
): string => {
	const {
		markers = false,
		pretty = true,
		indent = '\t',
		nodeIds = false,
	} = options

	const render = (
		node: TreeNode,
		depth: number,
		raw: boolean,
		svg: boolean
	): string => {
		if (node.type === 'text') return raw ? node.text : escapeText(node.text)
		const tag = node.tag
		const lower = tag.toLowerCase()
		const inSvg = svg || lower === 'svg'
		const open = `<${tag}${attributes(node, markers, nodeIds)}`
		if (VOID.has(lower)) return `${open}>`
		if (inSvg && node.children.length === 0) return `${open} />`
		const childRaw = raw || RAW_TEXT.has(lower)
		if (pretty && isBlockList(node.children)) {
			const pad = indent.repeat(depth + 1)
			const inner = node.children
				.map((child) => pad + render(child, depth + 1, childRaw, inSvg))
				.join('\n')
			return `${open}>\n${inner}\n${indent.repeat(depth)}</${tag}>`
		}
		const inner = node.children
			.map((child) => render(child, depth, childRaw, inSvg))
			.join('')
		return `${open}>${inner}</${tag}>`
	}

	const separator =
		pretty && nodes.every((n) => n.type === 'element') ? '\n' : ''
	return nodes.map((node) => render(node, 0, false, false)).join(separator)
}
