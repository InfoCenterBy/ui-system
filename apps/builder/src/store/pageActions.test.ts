import { beforeEach, describe, expect, it } from 'vitest'
import type { Page, Site } from '@ui-system/core'
import { useDocument } from '@/store/document'
import {
	addPage,
	deletePage,
	duplicatePage,
	movePage,
	setHomePage,
	setPageSlug,
	slugify,
	updateSite,
} from '@/store/pageActions'
import { useProject } from '@/store/project'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home', 'about'],
}

const page = (id: string, slug: string): Page => ({
	id,
	slug,
	name: id,
	meta: { title: id, description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections: [],
})

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [page('home', 'index'), page('about', 'about')],
		partials: { header: null, footer: null },
	})
})

const doc = () => useDocument.getState().doc!

describe('slugify', () => {
	it('transliterates Cyrillic and cleans the rest', () => {
		expect(slugify('О компании')).toBe('o-kompanii')
		expect(slugify('Щука & Ёж!')).toBe('shchuka-ezh')
		expect(slugify('  Hello   World  ')).toBe('hello-world')
		expect(slugify('???')).toBe('')
	})
})

describe('addPage', () => {
	it('creates a page, lists it and opens it', () => {
		const id = addPage('О компании')
		expect(id).toBe('o-kompanii')
		expect(doc().pages['o-kompanii']).toMatchObject({
			slug: 'o-kompanii',
			name: 'О компании',
			meta: { title: 'О компании' },
		})
		expect(doc().site.pages).toEqual(['home', 'about', 'o-kompanii'])
		expect(useProject.getState().currentPageId).toBe('o-kompanii')
	})

	it('keeps slugs unique and index reserved', () => {
		expect(addPage('About')).toBe('about-2')
		expect(addPage('About')).toBe('about-3')
		expect(addPage('Index')).toBe('index-2')
		expect(addPage('???')).toBe('page')
	})

	it('is one undo step', () => {
		addPage('News')
		useDocument.getState().undo()
		expect(doc().pages['news']).toBeUndefined()
		expect(doc().site.pages).toEqual(['home', 'about'])
	})
})

describe('setPageSlug', () => {
	it('validates and keeps the id', () => {
		expect(setPageSlug('about', 'Bad Slug')).not.toBeNull()
		expect(setPageSlug('about', 'index')).not.toBeNull()
		expect(setPageSlug('home', 'start')).not.toBeNull()
		expect(setPageSlug('about', 'team')).toBeNull()
		expect(doc().pages['about']?.slug).toBe('team')
		expect(doc().pages['about']?.id).toBe('about')
	})

	it('rejects a slug used by another page', () => {
		addPage('News')
		expect(setPageSlug('about', 'news')).not.toBeNull()
	})
})

describe('deletePage', () => {
	it('refuses the home page', () => {
		expect(deletePage('home')).toBe(false)
		expect(doc().pages['home']).toBeDefined()
	})

	it('removes the page and falls back to home', () => {
		useProject.getState().setCurrentPage('about')
		expect(deletePage('about')).toBe(true)
		expect(doc().pages['about']).toBeUndefined()
		expect(doc().site.pages).toEqual(['home'])
		expect(useProject.getState().currentPageId).toBe('home')
	})
})

describe('setHomePage', () => {
	it('swaps the index slug', () => {
		setHomePage('about')
		expect(doc().pages['about']?.slug).toBe('index')
		expect(doc().pages['home']?.slug).toBe('home')
		setHomePage('home')
		expect(doc().pages['home']?.slug).toBe('index')
		expect(doc().pages['about']?.slug).toBe('about')
	})
})

describe('duplicate, move and site', () => {
	it('duplicates with a fresh slug right after the source', () => {
		const id = duplicatePage('about')
		expect(id).toBe('about-copy')
		expect(doc().pages['about-copy']?.name).toBe('about copy')
		expect(doc().site.pages).toEqual(['home', 'about', 'about-copy'])
	})

	it('moves pages within bounds', () => {
		movePage('about', 0)
		expect(doc().site.pages).toEqual(['about', 'home'])
		movePage('about', 99)
		expect(doc().site.pages).toEqual(['home', 'about'])
	})

	it('merges typing into one site edit', () => {
		updateSite({ name: 'A' })
		updateSite({ name: 'AB' })
		expect(doc().site.name).toBe('AB')
		useDocument.getState().undo()
		expect(doc().site.name).toBe('Test')
	})
})
