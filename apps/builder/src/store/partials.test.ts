import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	findElement,
	serializeHtml,
	walk,
	type ElementNode,
	type Page,
	type Site,
} from '@ui-system/core'
import { sectionPresets } from '@ui-system/blocks/sections'
import {
	addSection,
	fillMenuWithPages,
	placeholderPath,
	placePreset,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import {
	addPage,
	deletePage,
	renamePage,
	setMenuSync,
} from '@/store/pageActions'
import { useProject } from '@/store/project'

vi.mock('@/api', () => ({
	api: {
		placeholder: () => Promise.resolve({ path: 'assets/placeholder.svg' }),
	},
}))

const PAGES = [
	['index.html', 'Главная'],
	['about.html', 'О нас'],
	['blog.html', 'Блог'],
]

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
		components: [],
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
		placePreset('header-simple')
		fillMenuWithPages()
		expect(links(doc().partials.header!)).toEqual(PAGES)
		useDocument.getState().undo()
		expect(links(doc().partials.header!)).toHaveLength(3)
		expect(links(doc().partials.header!)[1]).toEqual(['#', 'About'])
	})

	it('keeps the menu in sync with pages in the same undo step', () => {
		placePreset('header-simple')
		setMenuSync(true)
		expect(links(doc().partials.header!)).toEqual(PAGES)
		expect(doc().site.layout?.menuSync).toBe(true)
		renamePage('about', 'Команда')
		expect(links(doc().partials.header!)[1]).toEqual([
			'about.html',
			'Команда',
		])
		addPage('Contacts')
		expect(links(doc().partials.header!)).toHaveLength(4)
		deletePage('blog')
		expect(links(doc().partials.header!)).toHaveLength(3)
		useDocument.getState().undo()
		expect(links(doc().partials.header!)).toHaveLength(4)
		expect(doc().pages.blog).toBeDefined()
	})

	it('fills the desktop and the mobile menu of a header', () => {
		for (const id of ['header-cta', 'header-dark']) {
			placePreset(id)
			fillMenuWithPages()
			expect(links(doc().partials.header!)).toEqual([...PAGES, ...PAGES])
		}
	})

	it('swaps demo photos of inserted presets for the local placeholder', () => {
		expect(
			sectionPresets.some((p) => p.html.includes('img.daisyui.com'))
		).toBe(true)
		return placeholderPath().then(() => {
			for (const preset of sectionPresets) {
				if (!preset.html.includes('img.daisyui.com')) continue
				const id = addSection(preset.id)
				const section = findElement(doc().pages.home.sections, id)!
				expect(serializeHtml([section])).not.toContain('daisyui.com')
			}
		})
	})
})
