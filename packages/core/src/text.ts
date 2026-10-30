import type { ElementNode } from './types'

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
export const isTextLike = (node: ElementNode): boolean =>
	(node.children.length > 0 || TEXT_TAGS.has(node.tag.toLowerCase())) &&
	node.children.every(
		(child) =>
			child.type === 'text' ||
			(INLINE.has(child.tag.toLowerCase()) &&
				!child.classes &&
				(child.tag.toLowerCase() === 'br' || isTextLike(child)))
	)
