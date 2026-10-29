import { describe, expect, it } from 'vitest'
import type { FontChoice } from '@ui-system/core'
import { fontCss } from './css'
import { GOOGLE_SAMPLE, METADATA_SAMPLE } from './fonts.fixture'
import {
	googleCssUrl,
	parseGoogleCss,
	parseMetadata,
	searchFonts,
} from './fonts'

const inter: FontChoice = {
	family: 'Inter',
	files: [
		{
			weight: 400,
			style: 'normal',
			file: 'assets/fonts/inter-400-latin.woff2',
			unicodeRange: 'U+0000-00FF',
		},
		{ weight: 700, style: 'italic', file: 'assets/fonts/inter-700.ttf' },
	],
}

describe('fontCss', () => {
	it('emits nothing without fonts', () => {
		expect(fontCss(undefined)).toBe('')
		expect(fontCss({ heading: null, body: null })).toBe('')
	})

	it('writes faces with format, swap and unicode-range', () => {
		const css = fontCss({ heading: null, body: inter })
		expect(css).toContain('font-family: "Inter";')
		expect(css).toContain(
			'src: url("assets/fonts/inter-400-latin.woff2") format("woff2");'
		)
		expect(css).toContain('format("truetype")')
		expect(css).toContain('font-display: swap;')
		expect(css).toContain('unicode-range: U+0000-00FF;')
		expect(css).toContain('font-style: italic;')
		expect(css).toContain('--font-sans: "Inter"')
		expect(css).toContain('html {\n\tfont-family: var(--font-sans);')
		expect(css).not.toContain('.font-heading')
	})

	it('applies the heading family to h1-h6 and .font-heading', () => {
		const css = fontCss({
			heading: { family: 'Playfair Display', files: inter.files },
			body: null,
		})
		expect(css).toContain('h1, h2, h3, h4, h5, h6, .font-heading')
		expect(css).toContain('--font-heading: "Playfair Display"')
		expect(css).not.toContain('--font-sans')
	})

	it('adds the prefix and does not repeat a shared file', () => {
		const css = fontCss({ heading: inter, body: inter }, '/site/')
		expect(css).toContain('url("/site/assets/fonts/inter-400-latin.woff2")')
		expect(css.match(/@font-face/g)).toHaveLength(2)
	})

	it('drops characters that could break out of a rule', () => {
		const css = fontCss({
			heading: null,
			body: { family: 'A"; } body { x: y', files: [] },
		})
		expect(css).not.toContain('"; }')
	})
})

describe('google css', () => {
	it('keeps latin and cyrillic subsets only', () => {
		const faces = parseGoogleCss(GOOGLE_SAMPLE)
		expect(faces.map((f) => f.subset)).toEqual(['cyrillic', 'latin'])
		expect(faces[1]).toMatchObject({
			style: 'italic',
			weight: 700,
			url: 'https://fonts.gstatic.com/s/inter/v20/lat.woff2',
			unicodeRange: 'U+0000-00FF, U+0131',
		})
	})

	it('builds the css2 url', () => {
		expect(googleCssUrl('Playfair Display', [700, 400], false)).toBe(
			'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap'
		)
		expect(googleCssUrl('Inter', [400], true)).toContain(
			'ital,wght@0,400;1,400'
		)
	})
})

describe('search', () => {
	const list = parseMetadata(METADATA_SAMPLE)

	it('reads weights and categories', () => {
		expect(list[0]).toEqual({
			family: 'Roboto',
			category: 'Sans Serif',
			weights: [400, 700],
		})
		expect(list[3].weights).toEqual([100, 400])
	})

	it('puts prefix matches first and limits to 20', () => {
		expect(searchFonts(list, 'in').map((f) => f.family)).toEqual([
			'Intel One',
			'Inter',
			'Mint',
		])
		const many = Array.from({ length: 50 }, (_, i) => ({
			family: `Font ${i}`,
			category: '',
			weights: [400],
		}))
		expect(searchFonts(many, 'font')).toHaveLength(20)
	})
})
