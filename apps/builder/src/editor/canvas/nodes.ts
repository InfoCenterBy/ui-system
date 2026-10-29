import { ancestorsOf, findElement, type ElementNode } from '@ui-system/core'
import { getSectionPreset } from '@ui-system/blocks/sections'

const SLOT_LABEL = { text: 'Text', rich: 'Text', image: 'Image', link: 'Link' }

export const labelOf = (node: ElementNode) => {
	if (node.section) {
		return getSectionPreset(node.section.preset)?.name ?? 'Section'
	}
	if (node.slot) return SLOT_LABEL[node.slot]
	if (node.repeat) return 'Item'
	return node.tag
}

// In a locked section only slots, repeat items and the section itself are picked
export const pickTarget = (roots: ElementNode[], id: string | null) => {
	if (!id) return null
	const node = findElement(roots, id)
	if (!node) return null
	const chain = [...ancestorsOf(roots, id), node].reverse()
	const section = chain.find((el) => el.section)
	if (section && !section.section?.locked) return node.id
	const target = chain.find((el) => el.slot || el.repeat || el.section)
	return target?.id ?? null
}

// Inline tags the text editor keeps, others would be lost on save
const INLINE = new Set(['a', 'b', 'br', 'em', 'i', 'strong'])
const TEXT_TAGS = new Set([
	'a',
	'blockquote',
	'button',
	'dd',
	'dt',
	'figcaption',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'label',
	'li',
	'p',
	'span',
	'td',
	'th',
])

// Elements that hold only text and plain inline formatting
const isTextLike = (node: ElementNode): boolean =>
	(node.children.length > 0 || TEXT_TAGS.has(node.tag.toLowerCase())) &&
	node.children.every(
		(child) =>
			child.type === 'text' ||
			(INLINE.has(child.tag.toLowerCase()) &&
				!child.classes &&
				(child.tag.toLowerCase() === 'br' || isTextLike(child)))
	)

// How a double-click edits a node: its slot kind, or rich text inside an unlocked section
export const inlineKindOf = (roots: ElementNode[], node: ElementNode) => {
	if (node.slot === 'text' || node.slot === 'rich' || node.slot === 'link') {
		return node.slot
	}
	if (node.slot) return null
	const chain = [...ancestorsOf(roots, node.id), node]
	const section = chain.findLast((el) => el.section)
	if (!section || section.section?.locked) return null
	return isTextLike(node) ? 'rich' : null
}
