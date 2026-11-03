import type { ElementNode } from '@ui-system/core'

// Attributes that tie a button to a form or to a popover, dialog or menu
const BOUND = ['command', 'commandfor', 'popovertarget', 'popovertargetaction']

// A plain button can become a link, a form or popover trigger cannot
export const canBecomeLink = (node: ElementNode) =>
	node.tag.toLowerCase() === 'button' &&
	!BOUND.some((name) => name in node.attrs) &&
	['', 'button'].includes((node.attrs.type ?? '').toLowerCase())

// Text can be edited in the panel only when nothing else is inside
export const hasPlainText = (node: ElementNode) =>
	node.children.every((child) => child.type === 'text')

export const plainText = (node: ElementNode) =>
	node.children
		.map((child) => (child.type === 'text' ? child.text : ''))
		.join('')
