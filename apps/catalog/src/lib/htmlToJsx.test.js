// @vitest-environment jsdom
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { htmlToJsx } from './htmlToJsx'

const LIBRARY = '../../packages/blocks/src/library'

const libraryFiles = readdirSync(LIBRARY).flatMap((dir) =>
	readdirSync(`${LIBRARY}/${dir}`).map((file) => `${dir}/${file}`)
)

describe('htmlToJsx', () => {
	it('renames class and for', () => {
		expect(htmlToJsx('<label for="a" class="label">A</label>')).toBe(
			'<label htmlFor="a" className="label">A</label>'
		)
	})

	it('wraps several roots in a fragment', () => {
		expect(htmlToJsx('<b>a</b><i>b</i>')).toBe(
			'<>\n\t<b>a</b>\n\t<i>b</i>\n</>'
		)
	})

	it('self-closes void and empty elements', () => {
		expect(htmlToJsx('<input class="input"><span></span>')).toBe(
			'<>\n\t<input className="input" />\n\t<span />\n</>'
		)
	})

	it('turns inline handlers into arrow functions', () => {
		expect(htmlToJsx('<button onclick="open()">Go</button>')).toBe(
			'<button onClick={() => open()}>Go</button>'
		)
	})

	it('converts style to an object and keeps custom properties quoted', () => {
		expect(
			htmlToJsx('<span style="--value: 70; font-size: 2rem"></span>')
		).toBe("<span style={{ '--value': '70', fontSize: '2rem' }} />")
	})

	it('uses uncontrolled props for form state', () => {
		expect(htmlToJsx('<input type="checkbox" checked>')).toBe(
			'<input type="checkbox" defaultChecked />'
		)
		expect(
			htmlToJsx(
				'<select><option>A</option><option selected>B</option></select>'
			)
		).toBe(
			'<select defaultValue="B">\n\t<option>A</option>\n\t<option>B</option>\n</select>'
		)
	})

	it('camelCases svg attributes but keeps aria and data', () => {
		expect(
			htmlToJsx(
				'<svg viewBox="0 0 24 24" aria-label="x" data-a="1"><path stroke-width="2" fill-rule="evenodd"/></svg>'
			)
		).toBe(
			'<svg viewBox="0 0 24 24" aria-label="x" data-a="1">\n\t<path strokeWidth="2" fillRule="evenodd" />\n</svg>'
		)
	})

	it('escapes braces and angle brackets in text', () => {
		expect(htmlToJsx('<p>{a} &lt; b</p>')).toBe(
			"<p>{'{'}a{'}'} {'<'} b</p>"
		)
	})

	it('replaces scripts with a hint comment', () => {
		expect(htmlToJsx('<b>a</b><script>alert(1)</script>')).toBe(
			[
				'<>',
				'\t<b>a</b>',
				'\t{/* Script from the HTML example is not included, run it in useEffect */}',
				'</>',
			].join('\n')
		)
	})

	it.each(libraryFiles)('converts library/%s', (file) => {
		const jsx = htmlToJsx(readFileSync(`${LIBRARY}/${file}`, 'utf8'))
		expect(jsx).not.toMatch(/\s(class|for|onclick)=/)
	})
})
