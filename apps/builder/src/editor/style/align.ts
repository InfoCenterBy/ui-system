import {
	NODE_ID_ATTR,
	getUtility,
	setUtility,
	type Breakpoint,
	type UtilityGroup,
} from '@ui-system/core'

export interface AlignLayout {
	display: string
	flexDirection: string
	inline: boolean
	shrinkWrapped: boolean
	parentDisplay: string
	parentFlexDirection: string
}

export type AlignCompanion =
	{ group: UtilityGroup; utility: string } | { hint: string } | null

const SIDE: Record<string, string> = {
	'text-left': 'start',
	'text-center': 'center',
	'text-right': 'end',
	'text-justify': 'start',
	'text-start': 'start',
	'text-end': 'end',
}

const INLINE_HINT = 'Inline element: align its parent instead'
const WRAP_HINT = 'As wide as its text: set a width or align the parent'

// Extra utility that makes a text-* alignment visible for the element's layout
export const alignCompanion = (
	layout: AlignLayout,
	align: string
): AlignCompanion => {
	const side = SIDE[align]
	if (!side) return null
	const { display } = layout
	// A flex or grid box as wide as its content can only move as a whole
	if (layout.shrinkWrapped) return parentCompanion(layout, side)
	if (display === 'flex' || display === 'inline-flex') {
		return layout.flexDirection.startsWith('column')
			? { group: 'align-items', utility: `items-${side}` }
			: { group: 'justify-content', utility: `justify-${side}` }
	}
	if (display === 'grid' || display === 'inline-grid') {
		return { group: 'justify-items', utility: `justify-items-${side}` }
	}
	if (layout.inline) return { hint: INLINE_HINT }
	return null
}

// Moves a shrink-wrapped element inside its parent when the parent allows it
const parentCompanion = (layout: AlignLayout, side: string): AlignCompanion => {
	if (layout.inline) return { hint: INLINE_HINT }
	const parentFlex =
		layout.parentDisplay === 'flex' ||
		layout.parentDisplay === 'inline-flex'
	if (parentFlex && layout.parentFlexDirection.startsWith('column')) {
		return { group: 'align-self', utility: `self-${side}` }
	}
	if (
		layout.parentDisplay === 'grid' ||
		layout.parentDisplay === 'inline-grid'
	) {
		return { group: 'justify-self', utility: `justify-self-${side}` }
	}
	return { hint: WRAP_HINT }
}

// Companion groups only ever hold start, center or end from this feature
const isWritten = (utility: string | null) =>
	utility !== null && /-(start|center|end)$/.test(utility)

// Layout of a node's element in the canvas document, null when it is not there
export const readLayout = (
	doc: Document | null,
	id: string
): AlignLayout | null => {
	try {
		const el = doc?.querySelector(`[${NODE_ID_ATTR}="${id}"]`)
		const win = doc?.defaultView
		if (!el || !win) return null
		const style = win.getComputedStyle(el)
		const parent = el.parentElement
		const parentStyle = parent ? win.getComputedStyle(parent) : null
		const range = doc!.createRange()
		range.selectNodeContents(el)
		const text = range.getBoundingClientRect().width
		const pad =
			parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
		const content = el.clientWidth - pad
		return {
			display: style.display,
			flexDirection: style.flexDirection,
			inline: style.display === 'inline',
			shrinkWrapped: content - text < 1,
			parentDisplay: parentStyle?.display ?? '',
			parentFlexDirection: parentStyle?.flexDirection ?? '',
		}
	} catch {
		return null
	}
}

// Classes after choosing an alignment, with its companion in the same pass
export const applyAlign = (
	classes: string,
	bp: Breakpoint,
	utility: string | null,
	layout: AlignLayout | null
) => {
	let next = setUtility(classes, 'text-align', bp, utility)
	if (!layout) return next
	if (utility) {
		const c = alignCompanion(layout, utility)
		if (c && 'group' in c) next = setUtility(next, c.group, bp, c.utility)
		return next
	}
	// Reset drops the companion only when it is one of ours
	const c = alignCompanion(layout, 'text-left')
	if (c && 'group' in c) {
		const own = getUtility(next, c.group, bp)
		if (isWritten(own)) next = setUtility(next, c.group, bp, null)
	}
	return next
}
