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

// Deep copy of nodes for inserting into a page: ids and radio or checkbox names
// become unique, references follow, demo images are swapped. Node ids stay
export const prepareInsert = (
	nodes: TreeNode[],
	opts: PrepareOptions
): TreeNode[] => {
	const token = opts.newId()
	const ids = new Map<string, string>()
	const names = new Map<string, string>()
	walk(nodes, (node) => {
		if (!isElement(node)) return
		const id = node.attrs.id
		if (id) ids.set(id, `${id}-${token}`)
		const name = node.attrs.name
		if (name && isCheckable(node)) names.set(name, `${name}-${token}`)
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
			else attrs[key] = value
		}
		const tag = node.tag.toLowerCase()
		if (opts.imageSrc !== undefined) {
			if (tag === 'img' && attrs.src?.startsWith(DEMO_IMAGES)) {
				attrs.src = opts.imageSrc
				delete attrs.srcset
			} else if (
				tag === 'source' &&
				attrs.srcset?.startsWith(DEMO_IMAGES)
			) {
				attrs.srcset = opts.imageSrc
			}
		}
		// Background images set inline, like a hero with an overlay
		if (opts.imageSrc !== undefined && attrs.style?.includes(DEMO_IMAGES)) {
			attrs.style = attrs.style.replace(
				/url\(\s*['"]?https:\/\/img\.daisyui\.com[^)'"]*['"]?\s*\)/g,
				`url(${opts.imageSrc})`
			)
		}
		return {
			...node,
			attrs,
			section: node.section && { ...node.section },
			children: node.children.map(copy),
		}
	}
	return nodes.map(copy)
}
