import type { Page } from '@ui-system/core'

export type LinkTarget =
	| { kind: 'page'; id: string }
	| { kind: 'external' }
	| { kind: 'blocked' }
	| { kind: 'native' }

// What a click on a link does in preview: other pages switch the canvas,
// other sites open in a tab, anchors and the rest behave natively
export const previewLinkTarget = (
	href: string,
	pages: Pick<Page, 'id' | 'slug'>[]
): LinkTarget => {
	if (href.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(href)) {
		return { kind: 'native' }
	}
	if (/^(https?:)?\/\//i.test(href)) return { kind: 'external' }
	const file = href.split(/[?#]/)[0].replace(/^\.?\//, '')
	const match = /^(.+)\.html$/.exec(file)
	const slug = match ? match[1] : file || 'index'
	const page = pages.find((p) => p.slug === slug)
	if (page) return { kind: 'page', id: page.id }
	// Unknown relative links would load a broken page inside the frame
	return { kind: 'blocked' }
}
