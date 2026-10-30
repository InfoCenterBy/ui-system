import callyUrl from 'cally?url'
import {
	NODE_ID_ATTR,
	isElement,
	serializeHtml,
	walk,
	type ElementNode,
} from '@ui-system/core'
import { EMPTY_HINT_LABELS } from '@/editor/layoutPresets'

export const PAGE_ROOT = 'page'

// Editor-only marks on the page shell, set from the site layout
export const SHELL_ATTR = 'data-shell'

// Editor-only mark on empty containers, never part of the saved or exported HTML
export const EMPTY_SLOT_ATTR = 'data-editor-empty'

// Editor-only mark on a modal, popover or dropdown shown while it is selected
export const OPEN_ATTR = 'data-editor-open'

// Empty document the canvas fills in, assets resolve against the builder origin
export const frameSrcdoc = () => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${location.origin}/">
<style id="site-css"></style>
<style>
	html { scroll-behavior: auto; }
	#page[data-sticky-footer] { display: flex; flex-direction: column; min-height: 100vh; }
	#page[data-sticky-footer] > [${SHELL_ATTR}="footer"] { margin-top: auto; }
	#page[data-header="sticky"] > [${SHELL_ATTR}="header"], #page[data-header="autohide"] > [${SHELL_ATTR}="header"] { position: sticky; top: 0; z-index: 40; }
	#page[data-header="autohide"] > [${SHELL_ATTR}="header"] { transition: transform 300ms; }
	@media (prefers-reduced-motion: reduce) { #page[data-header="autohide"] > [${SHELL_ATTR}="header"] { transition: none; } }
	#page[data-header="fixed"] > [${SHELL_ATTR}="header"] { position: fixed; inset-inline: 0; top: 0; z-index: 40; }
	[data-empty] { display: grid; place-items: center; min-height: 60vh; color: #888; font: 14px system-ui; }
	[contenteditable] { outline: none; cursor: text; }
	a, button, label { cursor: default; }
	[${EMPTY_SLOT_ATTR}] { position: relative; min-height: 6rem; outline: 1px dashed #94a3b8; outline-offset: -1px; }
	[${EMPTY_SLOT_ATTR}]::after { content: 'Add elements from the Elements tab'; position: absolute; inset: 0; display: grid; place-items: center; padding: 0.5rem; text-align: center; color: #94a3b8; font: 14px system-ui; pointer-events: none; }
	dialog[${OPEN_ATTR}] { pointer-events: none !important; }
	dialog[${OPEN_ATTR}] .modal-box { pointer-events: auto !important; }
	dialog[${OPEN_ATTR}] .modal-backdrop { pointer-events: none !important; }
</style>
</head>
<body>
<div id="${PAGE_ROOT}"></div>
<script type="module" src="${callyUrl}"></script>
</body>
</html>`

const EMPTY = 'Add a section from the left panel'

const renderNode = (doc: Document, node: ElementNode) => {
	const template = doc.createElement('template')
	template.innerHTML = serializeHtml([node], { nodeIds: true, pretty: false })
	const el = template.content.firstElementChild as HTMLElement
	walk([node], (n) => {
		if (!isElement(n) || !n.label || !EMPTY_HINT_LABELS.includes(n.label)) {
			return
		}
		if (n.children.some((c) => c.type !== 'text' || c.text.trim() !== '')) {
			return
		}
		const sel = `[${NODE_ID_ATTR}="${CSS.escape(n.id)}"]`
		const target = el.matches(sel) ? el : el.querySelector(sel)
		target?.setAttribute(EMPTY_SLOT_ATTR, '')
	})
	return el
}

// Root nodes keep their DOM while the node object is unchanged
export interface FrameCache {
	nodes: Map<string, { node: ElementNode; el: HTMLElement }>
}

export const createFrameCache = (): FrameCache => ({ nodes: new Map() })

// Makes the page root match the list, rebuilding only changed roots
export const syncRoots = (
	doc: Document,
	cache: FrameCache,
	roots: ElementNode[],
	skipId: string | null
) => {
	const container = doc.getElementById(PAGE_ROOT)
	if (!container) return
	const keep = new Set<string>()
	let previous: Element | null = null
	for (const node of roots) {
		keep.add(node.id)
		let entry = cache.nodes.get(node.id)
		// The root being edited inline is left alone until editing ends
		if (!entry || (entry.node !== node && node.id !== skipId)) {
			const el = renderNode(doc, node)
			if (entry) entry.el.replaceWith(el)
			entry = { node, el }
			cache.nodes.set(node.id, entry)
		}
		const expected: Element | null = previous
			? previous.nextElementSibling
			: container.firstElementChild
		if (expected !== entry.el) {
			container.insertBefore(entry.el, expected)
		}
		previous = entry.el
	}
	for (const [id, entry] of cache.nodes) {
		if (!keep.has(id)) {
			entry.el.remove()
			cache.nodes.delete(id)
		}
	}
	container.querySelector('[data-empty]')?.remove()
	if (roots.length === 0) {
		const empty = doc.createElement('div')
		empty.setAttribute('data-empty', '')
		empty.textContent = EMPTY
		container.append(empty)
	}
}

export const nodeIdAt = (target: EventTarget | null) => {
	const el = (target as Element | null)?.closest?.(`[${NODE_ID_ATTR}]`)
	return el?.getAttribute(NODE_ID_ATTR) ?? null
}

export const elementFor = (doc: Document, id: string) =>
	doc.querySelector<HTMLElement>(`[${NODE_ID_ATTR}="${CSS.escape(id)}"]`)

// Marks the header and footer roots and sets the layout on the page root
export const syncShell = (
	doc: Document,
	shell: { header: string | null; footer: string | null },
	layout: { header: string; stickyFooter: boolean }
) => {
	const page = doc.getElementById(PAGE_ROOT)
	if (!page) return
	page.toggleAttribute('data-sticky-footer', layout.stickyFooter)
	page.setAttribute('data-header', layout.header)
	for (const el of page.querySelectorAll(`:scope > [${SHELL_ATTR}]`)) {
		el.removeAttribute(SHELL_ATTR)
	}
	for (const part of ['header', 'footer'] as const) {
		const id = shell[part]
		if (id) elementFor(doc, id)?.setAttribute(SHELL_ATTR, part)
	}
}
