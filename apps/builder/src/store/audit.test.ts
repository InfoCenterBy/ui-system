import { describe, expect, it } from 'vitest'
import { parseSection, type Page, type Site } from '@ui-system/core'
import { auditDocument, hasBlockingIssues } from '@/store/audit'
import type { Doc } from '@/store/history'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'en',
	pathPrefix: '',
	url: 'https://example.com',
	favicon: 'assets/icon.svg',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home', 'about'],
}

const section = (id: string, html: string) =>
	parseSection({ id, name: id, category: 'test', html })

const page = (id: string, html: string, patch: Partial<Page> = {}): Page => ({
	id,
	slug: id === 'home' ? 'index' : id,
	name: id,
	meta: { title: id, description: 'About the page', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections: [section(`s-${id}`, html)],
	...patch,
})

const GOOD = '<section><h1>Title</h1><h2>Sub</h2><p>Text</p></section>'

const doc = (
	pages: Page[],
	extra: Partial<Doc> = {},
	siteExtra: Partial<Site> = {}
): Doc => ({
	site: { ...site, pages: pages.map((p) => p.id), ...siteExtra },
	pages: Object.fromEntries(pages.map((p) => [p.id, p])),
	partials: { header: null, footer: null },
	components: {},
	...extra,
})

// The default theme has its own contrast findings, they are tested apart
const audit = (d: Doc) =>
	auditDocument(d).filter((i) => i.code !== 'theme.contrast')

const codes = (d: Doc) => audit(d).map((i) => i.code)

describe('auditDocument', () => {
	it('finds nothing in a clean site', () => {
		expect(audit(doc([page('home', GOOD)]))).toEqual([])
	})

	it('flags empty links but not anchors or command buttons', () => {
		const html = `<section><h1>T</h1>
			<a href="">One</a><a href="#">Two</a><a href="#about">Ok</a>
			<a href="/x">Ok</a><button command="show-modal" commandfor="m">Open</button></section>`
		const issues = audit(doc([page('home', html)]))
		expect(issues.map((i) => i.code)).toEqual(['link.empty', 'link.empty'])
		expect(issues[0].params).toEqual({ text: 'One' })
		expect(issues[0].nodeId).toBeTruthy()
	})

	it('checks images', () => {
		const html = `<section><h1>T</h1>
			<img src="assets/a.png" alt="">
			<img src="assets/placeholder.svg" alt="A team at work">
			<img src="https://img.daisyui.com/x.jpg" alt="Photo">
			<img src="assets/b.png" alt="A real description"></section>`
		expect(codes(doc([page('home', html)]))).toEqual([
			'img.noAlt',
			'img.placeholder',
			'img.demoAlt',
			'img.external',
		])
	})

	it('checks SEO fields of pages', () => {
		const bad = page('home', GOOD, {
			meta: { title: ' ', description: '', ogImage: null },
		})
		const long = page('about', GOOD, {
			meta: { title: 'a', description: 'x'.repeat(161), ogImage: null },
		})
		const issues = audit(doc([bad, long]))
		expect(issues.map((i) => [i.code, i.level, i.pageId])).toEqual([
			['page.noTitle', 'warning', 'home'],
			['page.noDescription', 'warning', 'home'],
			['page.longDescription', 'info', 'about'],
		])
	})

	it('checks headings', () => {
		expect(
			codes(doc([page('home', '<section><p>x</p></section>')]))
		).toEqual(['heading.noH1'])
		expect(
			codes(
				doc([page('home', '<section><h1>a</h1><h1>b</h1></section>')])
			)
		).toEqual(['heading.multipleH1'])
		const skip = audit(
			doc([
				page(
					'home',
					'<section><h1>a</h1><h2>b</h2><h4>c</h4></section>'
				),
			])
		)
		expect(skip.map((i) => i.code)).toEqual(['heading.skip'])
		expect(skip[0].params).toEqual({ from: 2, to: 4 })
	})

	it('checks site settings', () => {
		const d = doc(
			[page('home', GOOD)],
			{},
			{
				lang: '',
				url: '',
				favicon: null,
			}
		)
		expect(audit(d).map((i) => [i.code, i.level])).toEqual([
			['site.noLang', 'error'],
			['site.noUrl', 'info'],
			['site.noFavicon', 'info'],
		])
		expect(hasBlockingIssues(auditDocument(d))).toBe(true)
		expect(
			hasBlockingIssues(
				audit(doc([page('home', GOOD)], {}, { url: '', favicon: null }))
			)
		).toBe(false)
	})

	it('reports theme contrast', () => {
		const d = doc(
			[page('home', GOOD)],
			{},
			{
				theme: {
					name: 'light',
					vars: {
						'--color-primary': 'oklch(60% 0.1 200)',
						'--color-primary-content': 'oklch(65% 0.1 200)',
					},
				},
			}
		)
		const found = auditDocument(d).find((i) => i.code === 'theme.contrast')
		expect(found?.params?.color).toBe('primary')
	})

	it('checks forms and their fields', () => {
		const html = `<section><h1>T</h1>
			<form action="#"><input type="text"><input type="submit">
			<select name="a"></select><textarea></textarea></form>
			<form action="/send"><input name="q"></form>
			<input type="checkbox"></section>`
		expect(codes(doc([page('home', html)]))).toEqual([
			'form.noAction',
			'field.noName',
			'field.noName',
		])
	})

	it('reports header and footer problems once', () => {
		const header = section(
			'h',
			'<header><a href="#">Home</a><h3>Menu</h3></header>'
		)
		const footer = section('f', '<footer><a href="">Contact</a></footer>')
		const d = doc([page('home', GOOD), page('about', GOOD)], {
			partials: { header, footer },
		})
		const links = audit(d).filter((i) => i.code === 'link.empty')
		expect(links.map((i) => i.pageId)).toEqual(['home', 'home'])
		const hidden = doc(
			[page('home', GOOD, { showHeader: false }), page('about', GOOD)],
			{ partials: { header, footer: null } }
		)
		const found = audit(hidden).filter((i) => i.code === 'link.empty')
		expect(found.map((i) => i.pageId)).toEqual(['about'])
	})
})
