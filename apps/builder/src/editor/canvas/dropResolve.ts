import {
	NODE_ID_ATTR,
	ancestorsOf,
	findElement,
	isElement,
	type ElementNode,
} from '@ui-system/core'
import { elementFor } from '@/editor/canvas/frame'
import { scopeOf } from '@/editor/canvas/nodes'
import { insertBlocker } from '@/editor/navigator/insertTarget'
import { canContain } from '@/editor/navigator/structure'
import type { Axis, Box, Candidate, Rect, Spot } from './dropTarget'
import { spotAt } from './dropTarget'

export type Hit =
	| { kind: 'spot'; spot: Spot; index: number }
	| { kind: 'blocked'; message: string }

const rectOf = (el: Element): Rect => {
	const r = el.getBoundingClientRect()
	return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
}

// Where a new child would go when the real rects can not tell: one child or none
const axisHint = (el: Element): Axis => {
	const style = el.ownerDocument.defaultView?.getComputedStyle(el)
	if (!style) return 'y'
	if (style.display === 'grid' || style.display === 'inline-grid') {
		return style.gridTemplateColumns.trim().split(/\s+/).length > 1
			? 'x'
			: 'y'
	}
	if (style.display !== 'flex' && style.display !== 'inline-flex') return 'y'
	if (!style.flexDirection.startsWith('row')) return 'y'
	// A wrapping row whose only child fills it puts the next one below
	const only = el.children.length === 1 ? el.children[0] : null
	if (only && style.flexWrap !== 'nowrap') {
		const inner =
			el.clientWidth -
			parseFloat(style.paddingLeft) -
			parseFloat(style.paddingRight)
		if (only.getBoundingClientRect().width >= inner - 1) return 'y'
	}
	return 'x'
}

// Rendered element children, the node is kept to map back to the tree index
const kidsOf = (doc: Document, node: ElementNode) =>
	node.children.filter(isElement).flatMap((child) => {
		const el = elementFor(doc, child.id)
		if (!el) return []
		const rect = rectOf(el)
		if (rect.right <= rect.left && rect.bottom <= rect.top) return []
		return [{ id: child.id, rect }] satisfies Box[]
	})

// A node takes children when it is no instance and passes canContain
const takes = (roots: ElementNode[], node: ElementNode, editing: boolean) =>
	!node.instance &&
	canContain(node) &&
	scopeOf(roots, node.id, editing) === 'free'

// Spot under the iframe point: nearest free-scope node that can take the drop
export const hitAt = (
	doc: Document,
	roots: ElementNode[],
	x: number,
	y: number,
	editing: boolean
): Hit | null => {
	const hit = doc
		.elementsFromPoint(x, y)
		.find((el) => el.hasAttribute(NODE_ID_ATTR))
	const hitId = hit?.getAttribute(NODE_ID_ATTR)
	const node = hitId ? findElement(roots, hitId) : null
	if (!hitId || !node) return null
	const chain = [...ancestorsOf(roots, hitId), node].reverse()
	for (let i = 0; i < chain.length; i++) {
		const el = chain[i]
		if (scopeOf(roots, el.id, editing) !== 'free') continue
		const parent = chain[i + 1] ?? null
		const container = takes(roots, el, editing)
		const parentOk = parent !== null && takes(roots, parent, editing)
		if (!container && !parentOk) continue
		const dom = elementFor(doc, el.id)
		if (!dom) continue
		const candidate: Candidate = {
			id: el.id,
			rect: rectOf(dom),
			container,
			kids: container ? kidsOf(doc, el) : [],
			axis: axisHint(dom),
			parent: null,
		}
		if (parentOk) {
			const parentDom = elementFor(doc, parent.id)
			if (parentDom) {
				candidate.parent = {
					id: parent.id,
					kids: kidsOf(doc, parent),
					axis: axisHint(parentDom),
				}
			}
		}
		const spot = spotAt(candidate, { x, y })
		if (!spot) continue
		const owner = findElement(roots, spot.parentId)
		if (!owner) continue
		// Map the element index to the children index, text nodes count there
		const kids = kidsOf(doc, owner)
		const next = kids[spot.index]
		const index = next
			? owner.children.findIndex((c) => c.id === next.id)
			: owner.children.length
		return { kind: 'spot', spot, index }
	}
	const message = insertBlocker(roots, hitId, editing)
	if (!message) return null
	const inInstance = message.includes('component instance')
	return {
		kind: 'blocked',
		message: inInstance
			? 'Components are edited in component mode'
			: message,
	}
}
