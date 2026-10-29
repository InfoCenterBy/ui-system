import {
	cloneNode,
	randomId,
	type Page,
	type PageMeta,
	type Site,
} from '@ui-system/core'
import { useDocument } from '@/store/document'
import type { Doc } from '@/store/history'
import { useProject } from '@/store/project'

export const HOME_SLUG = 'index'

const CYRILLIC: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	е: 'e',
	ё: 'e',
	ж: 'zh',
	з: 'z',
	и: 'i',
	й: 'y',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'kh',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'shch',
	ъ: '',
	ы: 'y',
	ь: '',
	э: 'e',
	ю: 'yu',
	я: 'ya',
	і: 'i',
	ї: 'yi',
	є: 'ye',
	ґ: 'g',
	ў: 'u',
}

// Latin lowercase slug with hyphens, Cyrillic is transliterated
export const slugify = (text: string) =>
	[...text.toLowerCase()]
		.map((ch) => CYRILLIC[ch] ?? ch)
		.join('')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

const isHome = (page: Page) => page.slug === HOME_SLUG

const homePage = (doc: Doc) => Object.values(doc.pages).find(isHome)

// A slug and id that are free: base, base-2, base-3 and so on
const freeName = (doc: Doc, text: string, ignoreId?: string) => {
	const base = slugify(text) || 'page'
	const taken = (slug: string) =>
		slug === HOME_SLUG ||
		Object.values(doc.pages).some(
			(p) => p.id !== ignoreId && (p.slug === slug || p.id === slug)
		)
	let slug = base
	for (let n = 2; taken(slug); n++) slug = `${base}-${n}`
	return slug
}

const doc = () => useDocument.getState().doc

export function addPage(name: string): string | null {
	const current = doc()
	const title = name.trim()
	if (!current || !title) return null
	const id = freeName(current, title)
	useDocument.getState().edit('Add page', (d) => {
		d.pages[id] = {
			id,
			slug: id,
			name: title,
			meta: { title, description: '', ogImage: null },
			showHeader: true,
			showFooter: true,
			sections: [],
		}
		d.site.pages.push(id)
	})
	useProject.getState().setCurrentPage(id)
	return id
}

export function renamePage(id: string, name: string) {
	const title = name.trim()
	if (!title) return
	useDocument.getState().edit(
		'Rename page',
		(d) => {
			const page = d.pages[id]
			if (page) page.name = title
		},
		{ mergeKey: `page:${id}:name` }
	)
}

// Returns an error message, or null when the slug was applied
export function setPageSlug(id: string, slug: string): string | null {
	const current = doc()
	const page = current?.pages[id]
	if (!current || !page) return 'Page not found'
	if (isHome(page)) return 'The home page is always index.html'
	if (!SLUG_RE.test(slug))
		return 'Use lowercase latin letters, digits and hyphens'
	if (slug === HOME_SLUG) return 'index is reserved for the home page'
	if (
		Object.values(current.pages).some((p) => p.id !== id && p.slug === slug)
	)
		return 'Another page already uses this file name'
	useDocument.getState().edit('Change page file name', (d) => {
		const target = d.pages[id]
		if (target) target.slug = slug
	})
	return null
}

export function updatePageMeta(id: string, meta: Partial<PageMeta>) {
	const keys = Object.keys(meta).sort().join(',')
	useDocument.getState().edit(
		'Edit page SEO',
		(d) => {
			const page = d.pages[id]
			if (page) Object.assign(page.meta, meta)
		},
		{ mergeKey: `page:${id}:meta:${keys}` }
	)
}

export function setPageFlags(
	id: string,
	flags: { showHeader?: boolean; showFooter?: boolean }
) {
	useDocument.getState().edit('Change page layout', (d) => {
		const page = d.pages[id]
		if (!page) return
		if (flags.showHeader !== undefined) page.showHeader = flags.showHeader
		if (flags.showFooter !== undefined) page.showFooter = flags.showFooter
	})
}

export function duplicatePage(id: string): string | null {
	const current = doc()
	const source = current?.pages[id]
	if (!current || !source) return null
	const name = `${source.name} copy`
	const newId = freeName(current, name)
	useDocument.getState().edit('Duplicate page', (d) => {
		const from = d.pages[id]
		if (!from) return
		d.pages[newId] = {
			...from,
			id: newId,
			slug: newId,
			name,
			meta: { ...from.meta },
			sections: from.sections.map((s) => cloneNode(s, randomId)),
		}
		d.site.pages.splice(d.site.pages.indexOf(id) + 1, 0, newId)
	})
	useProject.getState().setCurrentPage(newId)
	return newId
}

export function deletePage(id: string): boolean {
	const current = doc()
	const page = current?.pages[id]
	if (!current || !page || isHome(page)) return false
	const home = homePage(current)
	useDocument.getState().edit('Delete page', (d) => {
		delete d.pages[id]
		d.site.pages = d.site.pages.filter((p) => p !== id)
	})
	const project = useProject.getState()
	if (project.currentPageId === id) {
		const next = home?.id ?? doc()?.site.pages[0]
		if (next) project.setCurrentPage(next)
	}
	return true
}

export function movePage(id: string, toIndex: number) {
	useDocument.getState().edit('Move page', (d) => {
		const list = d.site.pages
		const from = list.indexOf(id)
		if (from < 0) return
		const to = Math.max(0, Math.min(list.length - 1, toIndex))
		list.splice(from, 1)
		list.splice(to, 0, id)
	})
}

export function setHomePage(id: string) {
	const current = doc()
	const page = current?.pages[id]
	if (!current || !page || isHome(page)) return
	const old = homePage(current)
	const oldSlug = old ? freeName(current, old.name, old.id) : null
	useDocument.getState().edit('Set home page', (d) => {
		const target = d.pages[id]
		if (!target) return
		const previous = old && d.pages[old.id]
		if (previous && oldSlug) previous.slug = oldSlug
		target.slug = HOME_SLUG
	})
}

export function updateSite(
	partial: Partial<Pick<Site, 'name' | 'lang' | 'pathPrefix'>>
) {
	const keys = Object.keys(partial).sort().join(',')
	useDocument.getState().edit(
		'Edit site',
		(d) => {
			Object.assign(d.site, partial)
		},
		{ mergeKey: `site:${keys}` }
	)
}
