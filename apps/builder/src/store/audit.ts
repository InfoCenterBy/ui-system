import {
	isElement,
	walk,
	type ElementNode,
	type Site,
	type TreeNode,
} from '@ui-system/core'
import {
	CONTENT_OF,
	contrastRatio,
	getColor,
	type ContentKey,
} from '@ui-system/theme'
import type { Doc } from '@/store/history'
import { themeFromSite } from '@/store/themeActions'

export type AuditLevel = 'error' | 'warning' | 'info'

export interface AuditIssue {
	level: AuditLevel
	code: string
	pageId?: string
	nodeId?: string
	params?: Record<string, string | number>
}

const MIN_CONTRAST = 4.5
const DESCRIPTION_LIMIT = 160
const PLACEHOLDER_SRC = 'assets/placeholder.svg'
const NO_VALUE_TYPES = ['submit', 'button', 'reset', 'image']
// Alt texts that only repeat what any image is
const GENERIC_ALT = new Set(['image', 'photo', 'picture', 'img', 'alt'])

const emptyHref = (href: string | undefined) => {
	const value = (href ?? '').trim()
	return value === '' || value === '#'
}

const textOf = (node: ElementNode): string =>
	node.children
		.map((child) => (isElement(child) ? textOf(child) : child.text))
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim()

// Link, image and form checks of one tree, in document order
const checkMarkup = (
	roots: TreeNode[],
	pageId: string | undefined,
	into: AuditIssue[]
) => {
	const push = (
		code: string,
		nodeId: string,
		params?: AuditIssue['params']
	) => into.push({ level: 'warning', code, pageId, nodeId, params })
	const visit = (node: TreeNode, inForm: boolean) => {
		if (!isElement(node)) return
		const tag = node.tag.toLowerCase()
		const { attrs } = node
		if (tag === 'a') {
			if (emptyHref(attrs.href)) {
				push('link.empty', node.id, { text: textOf(node).slice(0, 40) })
			}
		} else if (tag === 'img') {
			const alt = (attrs.alt ?? '').trim()
			const src = (attrs.src ?? '').trim()
			// An empty alt with role presentation is a deliberate decorative image
			const decorative = attrs.alt === '' && attrs.role === 'presentation'
			if (alt === '') {
				if (!decorative) push('img.noAlt', node.id)
			} else if (GENERIC_ALT.has(alt.toLowerCase())) {
				push('img.demoAlt', node.id, { alt })
			}
			if (src === PLACEHOLDER_SRC) push('img.placeholder', node.id)
			else if (/^(https?:)?\/\//i.test(src)) push('img.external', node.id)
		} else if (tag === 'form') {
			if (emptyHref(attrs.action)) push('form.noAction', node.id)
		} else if (tag === 'input' || tag === 'select' || tag === 'textarea') {
			const type = (attrs.type ?? '').toLowerCase()
			const sends = !(tag === 'input' && NO_VALUE_TYPES.includes(type))
			// Fields outside a form send nothing, so they need no name
			if (inForm && sends && !(attrs.name ?? '').trim()) {
				push('field.noName', node.id)
			}
		}
		for (const child of node.children) {
			visit(child, inForm || tag === 'form')
		}
	}
	for (const root of roots) visit(root, false)
}

// h1 count and skipped levels for what one page shows
const checkHeadings = (
	roots: TreeNode[],
	pageId: string,
	into: AuditIssue[]
) => {
	const h1: string[] = []
	let last = 0
	walk(roots, (node) => {
		if (!isElement(node)) return
		const level = /^h([1-6])$/i.exec(node.tag)?.[1]
		if (!level) return
		const n = Number(level)
		if (n === 1) h1.push(node.id)
		if (last > 0 && n > last + 1) {
			into.push({
				level: 'warning',
				code: 'heading.skip',
				pageId,
				nodeId: node.id,
				params: { from: last, to: n },
			})
		}
		last = n
	})
	if (h1.length === 0) {
		into.push({ level: 'warning', code: 'heading.noH1', pageId })
	}
	if (h1.length > 1) {
		into.push({
			level: 'warning',
			code: 'heading.multipleH1',
			pageId,
			nodeId: h1[1],
			params: { count: h1.length },
		})
	}
}

const checkTheme = (site: Site, into: AuditIssue[]) => {
	const theme = themeFromSite(site.theme)
	for (const [content, bg] of Object.entries(CONTENT_OF)) {
		const ratio = contrastRatio(
			getColor(theme, bg),
			getColor(theme, content as ContentKey)
		)
		// The theme tab already shows these, they don't block the export
		if (ratio < MIN_CONTRAST) {
			into.push({
				level: 'info',
				code: 'theme.contrast',
				params: {
					color: content.replace('-content', ''),
					ratio: Math.round(ratio * 100) / 100,
				},
			})
		}
	}
}

// Problems that would make the exported site worse, nothing here is saved
export function auditDocument(doc: Doc): AuditIssue[] {
	const { site, pages, partials } = doc
	const issues: AuditIssue[] = []
	if (!site.lang.trim()) issues.push({ level: 'error', code: 'site.noLang' })
	if (!site.url?.trim()) issues.push({ level: 'info', code: 'site.noUrl' })
	if (!site.favicon) issues.push({ level: 'info', code: 'site.noFavicon' })
	checkTheme(site, issues)

	// Header and footer are checked once, under the first page that shows them
	const seen = { header: false, footer: false }
	for (const id of site.pages) {
		const page = pages[id]
		if (!page) continue
		const own: AuditIssue[] = []
		const { title, description } = page.meta
		if (!title.trim()) {
			own.push({ level: 'warning', code: 'page.noTitle', pageId: id })
		}
		if (!description.trim()) {
			own.push({
				level: 'warning',
				code: 'page.noDescription',
				pageId: id,
			})
		} else if (description.length > DESCRIPTION_LIMIT) {
			own.push({
				level: 'info',
				code: 'page.longDescription',
				pageId: id,
				params: { count: description.length, max: DESCRIPTION_LIMIT },
			})
		}

		// Header and footer markup goes to the first page that shows it
		const header = page.showHeader ? partials.header : null
		const footer = page.showFooter ? partials.footer : null
		checkHeadings(
			[
				...(header ? [header] : []),
				...page.sections,
				...(footer ? [footer] : []),
			],
			id,
			own
		)
		const markup: AuditIssue[] = []
		const own1 = header && !seen.header ? header : null
		const own2 = footer && !seen.footer ? footer : null
		if (own1) seen.header = true
		if (own2) seen.footer = true
		checkMarkup(
			[
				...(own1 ? [own1] : []),
				...page.sections,
				...(own2 ? [own2] : []),
			],
			id,
			markup
		)
		issues.push(...own, ...markup)
	}
	return issues
}

export const hasBlockingIssues = (issues: AuditIssue[]) =>
	issues.some((issue) => issue.level !== 'info')
