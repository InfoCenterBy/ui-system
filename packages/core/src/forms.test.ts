import { describe, expect, it } from 'vitest'
import { counterIds } from './ids'
import { parseHtml, serializeHtml } from './html'
import { prepareInsert } from './insert'
import { isCurrentHref, markCurrentPage } from './currentPage'
import { suggestFieldName, uniqueName } from './forms'

const prepare = (html: string) =>
	serializeHtml(
		prepareInsert(parseHtml(html, counterIds()), { newId: () => 't' })
	)

describe('field names', () => {
	it('names fields in a form by type, label and placeholder', () => {
		const out = prepare(
			'<form><label><span>First name</span><input type="text" /></label>' +
				'<input type="email" /><input type="email" />' +
				'<input type="text" placeholder="City" /><textarea></textarea>' +
				'<button type="submit">Send</button></form>'
		)
		expect(out).toContain('name="first_name"')
		expect(out).toContain('name="email"')
		expect(out).toContain('name="email_2"')
		expect(out).toContain('name="city"')
		expect(out).toContain('name="message"')
		expect(out).not.toMatch(/<button[^>]*name=/)
	})

	it('keeps existing names and shares one radio group name', () => {
		const out = prepare(
			'<form><input name="a" /><input type="radio" /><input type="radio" />' +
				'<input type="text" /></form>'
		)
		expect(out).toContain('name="a"')
		expect(out.match(/name="choice"/g)).toHaveLength(2)
		expect(out).toContain('name="text"')
	})

	it('leaves toggles outside forms alone', () => {
		expect(prepare('<div><input type="checkbox" /></div>')).not.toContain(
			'name='
		)
	})

	it('suggests helpers', () => {
		const [input] = parseHtml('<input type="tel" />', counterIds())
		expect(suggestFieldName(input as never)).toBe('phone')
		expect(uniqueName('a', new Set(['a', 'a_2']))).toBe('a_3')
	})
})

describe('current page', () => {
	const about = { file: 'about.html', home: false, prefix: '/site/' }
	const home = { file: 'index.html', home: true, prefix: '' }
	it('matches hrefs with and without prefix', () => {
		expect(isCurrentHref('about.html', about)).toBe(true)
		expect(isCurrentHref('./about.html', about)).toBe(true)
		expect(isCurrentHref('/site/about.html', about)).toBe(true)
		expect(isCurrentHref('index.html', about)).toBe(false)
		expect(isCurrentHref('https://x/about.html', about)).toBe(false)
		expect(isCurrentHref('#top', home)).toBe(false)
		for (const href of ['index.html', './', '/', '']) {
			expect(isCurrentHref(href, home)).toBe(href !== '')
		}
	})
	it('marks links and adds menu-active inside a menu', () => {
		const roots = parseHtml(
			'<ul class="menu"><li><a href="about.html">A</a></li></ul><a href="about.html">B</a>',
			counterIds()
		)
		markCurrentPage(roots, about)
		const html = serializeHtml(roots)
		expect(html).toContain('class="menu-active"')
		expect(html.match(/aria-current="page"/g)).toHaveLength(2)
	})
})
