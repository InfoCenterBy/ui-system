import {
	isElement,
	slugName,
	walk,
	type ElementNode,
	type TreeNode,
} from '@ui-system/core'

export interface Popup {
	node: ElementNode
	kind: 'modal' | 'popover'
	// Empty until the popup gets an id
	id: string
}

export const popupKind = (node: ElementNode): Popup['kind'] | null => {
	if (
		node.tag.toLowerCase() === 'dialog' &&
		node.classes.split(/\s+/).includes('modal')
	)
		return 'modal'
	return 'popover' in node.attrs ? 'popover' : null
}

// Modals and popovers in the roots, in document order
export const listPopups = (roots: TreeNode[]): Popup[] => {
	const found: Popup[] = []
	walk(roots, (node) => {
		if (!isElement(node)) return
		const kind = popupKind(node)
		if (kind) found.push({ node, kind, id: node.attrs.id ?? '' })
	})
	return found
}

// The popup a button or link opens
export const popupFor = (trigger: ElementNode, popups: Popup[]) => {
	const link = trigger.tag.toLowerCase() === 'a'
	const id = link
		? (trigger.attrs.href ?? '').replace(/^#/, '')
		: (trigger.attrs.commandfor ?? trigger.attrs.popovertarget ?? '')
	if (link && !(trigger.attrs.href ?? '').startsWith('#')) return null
	return id ? (popups.find((p) => p.id === id) ?? null) : null
}

export const isValidPopupId = (id: string) => /^[A-Za-z][\w-]*$/.test(id)

// True when another element already uses the id
export const popupIdTaken = (roots: TreeNode[], id: string, self: string) => {
	let taken = false
	walk(roots, (node) => {
		if (isElement(node) && node.id !== self && node.attrs.id === id)
			taken = true
	})
	return taken
}

// Points every trigger of the popup id `from` at `to`, mutates the roots
export const retargetTriggers = (
	roots: TreeNode[],
	from: string,
	to: string
) => {
	walk(roots, (node) => {
		if (!isElement(node)) return
		const { attrs } = node
		if (node.tag.toLowerCase() === 'a') {
			if (attrs.href === `#${from}`) attrs.href = `#${to}`
			return
		}
		if (attrs.commandfor === from) attrs.commandfor = to
		if (attrs.popovertarget === from) attrs.popovertarget = to
	})
}

const BUTTON_RESET = {
	command: null,
	commandfor: null,
	popovertarget: null,
	popovertargetaction: null,
}

// Attribute changes that make the trigger open the popup, null removes the link
export const popupAttrs = (
	trigger: ElementNode,
	kind: Popup['kind'] | null,
	id: string
): Record<string, string | null> => {
	if (trigger.tag.toLowerCase() === 'a')
		return { href: kind ? `#${id}` : '#' }
	const type: Record<string, string> = trigger.attrs.type
		? {}
		: { type: 'button' }
	if (kind === 'modal')
		return {
			...BUTTON_RESET,
			...type,
			command: 'show-modal',
			commandfor: id,
		}
	if (kind === 'popover')
		return { ...BUTTON_RESET, ...type, popovertarget: id }
	return BUTTON_RESET
}

const firstText = (nodes: TreeNode[]): string => {
	for (const node of nodes) {
		const text =
			node.type === 'text' ? node.text.trim() : firstText(node.children)
		if (text) return text
	}
	return ''
}

// Short readable name of a popup for the list
export const popupTitle = (popup: Popup) => {
	const text = firstText(popup.node.children).slice(0, 28)
	return [popup.id || '—', text && `“${text}”`].filter(Boolean).join(' ')
}

// A free id like modal-contact or modal-2, from the popup heading when it is Latin
export const suggestPopupId = (roots: TreeNode[], popup: Popup) => {
	const used = new Set<string>()
	walk(roots, (node) => {
		if (isElement(node) && node.attrs.id) used.add(node.attrs.id)
	})
	const word = slugName(firstText(popup.node.children)).replace(/_/g, '-')
	const base = word ? `${popup.kind}-${word}` : popup.kind
	let id = base
	for (let n = 2; used.has(id); n++) id = `${base}-${n}`
	return id
}
