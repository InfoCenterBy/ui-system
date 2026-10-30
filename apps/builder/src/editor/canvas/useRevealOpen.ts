import { useEffect } from 'react'
import {
	NODE_ID_ATTR,
	ancestorsOf,
	findElement,
	type ElementNode,
} from '@ui-system/core'
import { OPEN_ATTR } from '@/editor/canvas/frame'
import { useProject } from '@/store/project'

const REVEAL =
	'dialog.modal, [popover], details.dropdown, .dropdown:not([popover]):not(details)'
// Not in the DOM typings yet
type WithSource = HTMLElement & {
	showPopover(options: { source: HTMLElement | null }): void
}

const POPOVER_ATTR = 'data-editor-popover'

const hidePopover = (el: HTMLElement) => {
	try {
		el.hidePopover()
	} catch {
		// already hidden
	}
	const original = el.getAttribute(POPOVER_ATTR)
	if (original !== null) {
		el.setAttribute('popover', original)
		el.removeAttribute(POPOVER_ATTR)
	}
}

const setOpen = (el: HTMLElement, open: boolean) => {
	if (el.hasAttribute(OPEN_ATTR) === open) return
	const tag = el.tagName.toLowerCase()
	if (open) el.setAttribute(OPEN_ATTR, '')
	else el.removeAttribute(OPEN_ATTR)
	if (el.hasAttribute('popover') || el.hasAttribute(POPOVER_ATTR)) {
		if (!open) return hidePopover(el)
		// Manual popovers do not close when the canvas is clicked
		el.setAttribute(POPOVER_ATTR, el.getAttribute('popover') ?? '')
		el.setAttribute('popover', 'manual')
		// The invoker is the implicit anchor, like after a real click
		const source = el.id
			? el.ownerDocument.querySelector<HTMLElement>(
					`[popovertarget="${CSS.escape(el.id)}"]`
				)
			: null
		try {
			;(el as WithSource).showPopover({ source })
		} catch {
			// not connected yet
		}
	} else if (tag === 'dialog' || tag === 'details') {
		if (open) el.setAttribute('open', '')
		else el.removeAttribute('open')
	} else {
		el.classList.toggle('dropdown-open', open)
	}
}

const GAP = 16

// A popover near the page end is cut by the canvas viewport: the page gets
// editor-only room below and scrolls so the whole panel is visible
const makeRoom = (doc: Document, shown: HTMLElement[]) => {
	const win = doc.defaultView
	if (!win) return
	let bottom = 0
	for (const el of shown) {
		if (!el.matches(':popover-open')) continue
		// Its full height, not the height squeezed into the viewport
		bottom = Math.max(
			bottom,
			el.getBoundingClientRect().top + win.scrollY + el.scrollHeight
		)
	}
	// Measured with the current room in place: dropping it first would let
	// the popover flip above for a moment and the room would never stay
	const room = parseFloat(doc.body.style.paddingBottom) || 0
	const page = doc.documentElement.scrollHeight - room
	const need = bottom ? Math.max(0, bottom + GAP - page) : 0
	if (Math.abs(need - room) > 1) {
		doc.body.style.paddingBottom = need ? `${need}px` : ''
	}
	if (!bottom) return
	const overflow = bottom + GAP - (win.scrollY + win.innerHeight)
	if (overflow > 0) win.scrollBy({ top: overflow })
}

// Nearest labelled element at or above a node, the component the node belongs to
const ownerOf = (roots: ElementNode[], node: ElementNode) =>
	[...ancestorsOf(roots, node.id), node].findLast((n) => n.label) ?? null

const isPopover = (el: HTMLElement) =>
	el.hasAttribute('popover') || el.hasAttribute(POPOVER_ATTR)

// While the selection is inside a modal, popover or dropdown it is shown open on the canvas
export function useRevealOpen(doc: Document | null, roots: ElementNode[]) {
	const selectedId = useProject((s) => s.selectedId)
	useEffect(() => {
		if (!doc) return
		const all = [...doc.querySelectorAll<HTMLElement>(REVEAL)]
		const wanted = new Set<HTMLElement>()
		// Per component one popover is shown: the one holding the selection or the first
		const popovers = new Map<string, { el: HTMLElement; inside: boolean }>()
		const selected = selectedId ? findElement(roots, selectedId) : null
		for (const el of selected ? all : []) {
			const node = findElement(roots, el.getAttribute(NODE_ID_ATTR) ?? '')
			const owner = node && ownerOf(roots, node)
			if (!node || !owner) continue
			if (
				owner.id !== selected!.id &&
				!findElement([owner], selected!.id)
			)
				continue
			if (!isPopover(el)) {
				wanted.add(el)
				continue
			}
			// A selected trigger button counts as being in its own panel
			const inside =
				node.id === selected!.id ||
				!!findElement([node], selected!.id) ||
				(!!el.id && selected!.attrs.popovertarget === el.id)
			const current = popovers.get(owner.id)
			if (!current || (inside && !current.inside))
				popovers.set(owner.id, { el, inside })
		}
		for (const { el } of popovers.values()) wanted.add(el)
		for (const el of all) if (!wanted.has(el)) setOpen(el, false)
		for (const el of wanted) setOpen(el, true)
		const frame = requestAnimationFrame(() =>
			makeRoom(
				doc,
				[...popovers.values()].map((p) => p.el)
			)
		)
		return () => cancelAnimationFrame(frame)
	}, [doc, roots, selectedId])
}
