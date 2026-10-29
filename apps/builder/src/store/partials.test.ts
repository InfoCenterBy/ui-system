import { beforeEach, describe, expect, it } from 'vitest'
import { walk, type ElementNode, type Page, type Site } from '@ui-system/core'
import { fillMenuWithPages, placePreset } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const page = (id: string, slug: string, name: string): Page => ({
	id,
	slug,
	name,
	meta: { title: name, description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections: [],
})

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home', 'about', 'blog'],
}

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [
			page('home', 'index', 'Главная'),
			page('about', 'about', 'О нас'),
			page('blog', 'blog', 'Блог'),
		],
		partials: { header: null, footer: null },
	})
})

const doc = () => useDocument.getState().doc!

const links = (root: ElementNode) => {
	const found: [string, string][] = []
	walk([root], (node) => {
		if (node.type === 'element' && node.repeat === 'nav') {
			walk(node.children, (child) => {
				if (child.type === 'element' && child.slot === 'link') {
					const text = child.children[0]
					found.push([
						child.attrs.href,
						text?.type === 'text' ? text.text : '',
					])
				}
			})
			return false
		}
	})
	return found
}

describe('shared sections', () => {
	it('puts header and footer presets into the partials, others into the page', () => {
		placePreset('header-simple')
		placePreset('hero-centered')
		placePreset('footer-simple')
		expect(doc().partials.header?.section?.preset).toBe('header-simple')
		expect(doc().partials.footer?.section?.preset).toBe('footer-simple')
		expect(doc().pages.home.sections.map((s) => s.section?.preset)).toEqual(
			['hero-centered']
		)
		expect(useProject.getState().selectedId).toBe(doc().partials.footer?.id)
	})

	it('fills the header menu with the site pages in order', () => {
		placePreset('header-cta')
		fillMenuWithPages()
		expect(links(doc().partials.header!)).toEqual([
			['index.html', 'Главная'],
			['about.html', 'О нас'],
			['blog.html', 'Блог'],
		])
		useDocument.getState().undo()
		expect(links(doc().partials.header!)).toHaveLength(3)
		expect(links(doc().partials.header!)[1]).toEqual(['#', 'About'])
	})
})
