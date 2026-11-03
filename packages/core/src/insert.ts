import { assignFieldNames } from './forms'
import { isElement, walk } from './tree'
import type { ElementNode, TreeNode } from './types'

export interface PrepareOptions {
	// Fresh unique token source
	newId: () => string
	// Replacement for external demo images
	imageSrc?: string
}

const DEMO_IMAGES = 'https://img.daisyui.com'

// Attributes holding one id or a space separated list of ids
const ID_REFS = new Set([
	'for',
	'form',
	'list',
	'popovertarget',
	'commandfor',
	'aria-controls',
	'aria-labelledby',
	'aria-describedby',
	'aria-owns',
	'aria-activedescendant',
	'headers',
	'data-target',
])

const isCheckable = (node: ElementNode) =>
	node.tag.toLowerCase() === 'input' &&
	['radio', 'checkbox'].includes((node.attrs.type ?? '').toLowerCase())

const renameRef = (value: string, ids: Map<string, string>) =>
	value
		.split(/(\s+)/)
		.map((part) => {
			const hash = part.startsWith('#')
			const next = ids.get(hash ? part.slice(1) : part)
			return next === undefined ? part : hash ? `#${next}` : next
		})
		.join('')

const ANCHOR_DECL = /(anchor-name|anchor-scope)\s*:\s*([^;]+)/g
const ANCHOR_USE =
	/(anchor-name|anchor-scope|position-anchor)(\s*:\s*)([^;]+)|(anchor(?:-size)?\(\s*)(--[\w-]+)/g

// Dashed anchor names declared in an inline style
const anchorNames = (style: string) =>
	[...style.matchAll(ANCHOR_DECL)].flatMap(
		(m) => m[2].match(/--[\w-]+/g) ?? []
	)

const renameAnchors = (style: string, names: Map<string, string>) =>
	style.replace(ANCHOR_USE, (all, prop, sep, list, fn, name) =>
		fn
			? `${fn}${names.get(name) ?? name}`
			: `${prop}${sep}${list.replace(/--[\w-]+/g, (n: string) => names.get(n) ?? n)}`
	)

// Points demo photos (img, source and inline background urls) at a local file
const swapDemoImage = (
	tag: string,
	attrs: Record<string, string>,
	imageSrc: string
) => {
	const name = tag.toLowerCase()
	if (name === 'img' && attrs.src?.startsWith(DEMO_IMAGES)) {
		attrs.src = imageSrc
		delete attrs.srcset
	} else if (name === 'source' && attrs.srcset?.startsWith(DEMO_IMAGES)) {
		attrs.srcset = imageSrc
	}
	// Background images set inline, like a hero with an overlay
	if (attrs.style?.includes(DEMO_IMAGES)) {
		attrs.style = attrs.style.replace(
			/url\(\s*['"]?https:\/\/img\.daisyui\.com[^)'"]*['"]?\s*\)/g,
			`url(${imageSrc})`
		)
	}
}

// In place, for freshly parsed trees such as a section preset
export const replaceDemoImages = (nodes: TreeNode[], imageSrc: string) =>
	walk(nodes, (node) => {
		if (isElement(node)) swapDemoImage(node.tag, node.attrs, imageSrc)
	})

// Deep copy of nodes for inserting into a page: ids, radio or checkbox names
// and inline CSS anchor names become unique, references follow, demo images
// are swapped. Node ids stay
export const prepareInsert = (
	nodes: TreeNode[],
	opts: PrepareOptions
): TreeNode[] => {
	const token = opts.newId()
	const ids = new Map<string, string>()
	const names = new Map<string, string>()
	const anchors = new Map<string, string>()
	walk(nodes, (node) => {
		if (!isElement(node)) return
		const id = node.attrs.id
		if (id) ids.set(id, `${id}-${token}`)
		const name = node.attrs.name
		if (name && isCheckable(node)) names.set(name, `${name}-${token}`)
		for (const anchor of anchorNames(node.attrs.style ?? ''))
			anchors.set(anchor, `${anchor}-${token}`)
	})

	const copy = (node: TreeNode): TreeNode => {
		if (!isElement(node)) return { ...node }
		const attrs: Record<string, string> = {}
		for (const [key, value] of Object.entries(node.attrs)) {
			if (key === 'id') attrs[key] = ids.get(value) ?? value
			else if (key === 'name' && isCheckable(node))
				attrs[key] = names.get(value) ?? value
			else if (
				ID_REFS.has(key) ||
				(key === 'href' && value.startsWith('#'))
			)
				attrs[key] = renameRef(value, ids)
			else if (key === 'style' && anchors.size > 0)
				attrs[key] = renameAnchors(value, anchors)
			else attrs[key] = value
		}
		if (opts.imageSrc !== undefined)
			swapDemoImage(node.tag, attrs, opts.imageSrc)
		return {
			...node,
			attrs,
			section: node.section && { ...node.section },
			children: node.children.map(copy),
		}
	}
	const result = nodes.map(copy)
	assignFieldNames(result)
	return result
}
