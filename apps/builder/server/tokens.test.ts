import { describe, expect, it } from 'vitest'
import type { DesignToken } from '@ui-system/core'
import { createApp } from './app'
import { buildExportCss, CssBuilder } from './css'
import { assertSite } from './validate'

const theme = { name: 'light', vars: {} }
const tokens: DesignToken[] = [
	{ name: 'brand', type: 'color', value: '#ff0000' },
	{ name: 'soft', type: 'color', value: 'var(--color-primary)' },
	{ name: 'section', type: 'spacing', value: '6rem' },
	{ name: 'card', type: 'radius', value: '1rem' },
	{ name: 'lead', type: 'font-size', value: '1.25rem' },
	{ name: 'content', type: 'container', value: '48rem' },
]
const classes = [
	'bg-brand',
	'text-brand/50',
	'bg-soft',
	'bg-soft/50',
	'py-section',
	'rounded-card',
	'text-lead',
	'max-w-content',
]

describe('token css', () => {
	it('turns tokens into utilities on the canvas', async () => {
		const css = await new CssBuilder().build(
			classes,
			theme,
			undefined,
			tokens
		)
		expect(css).toMatch(
			/\.bg-brand\s*\{\s*background-color: var\(--color-brand\)/
		)
		expect(css).toContain('--color-brand: #ff0000')
		expect(css).toContain('--spacing-section: 6rem')
		expect(css).toMatch(/\.py-section\s*\{[^}]*var\(--spacing-section\)/)
		expect(css).toMatch(/\.rounded-card\s*\{[^}]*var\(--radius-card\)/)
		expect(css).toMatch(/\.text-lead\s*\{[^}]*var\(--text-lead\)/)
		expect(css).toMatch(
			/\.max-w-content\s*\{[^}]*var\(--container-content\)/
		)
		expect(css).toContain(String.raw`.text-brand\/50`)
	})

	it('inlines theme color references so they follow the theme', async () => {
		const css = await new CssBuilder().build(
			classes,
			theme,
			undefined,
			tokens
		)
		expect(css).toMatch(
			/\.bg-soft\s*\{\s*background-color: var\(--color-primary\)/
		)
		expect(css).toMatch(
			/\.bg-soft\\\/50\s*\{[\s\S]*?var\(--color-primary\)/
		)
		expect(css).not.toContain('--color-soft')
	})

	it('emits only the used tokens in the export', async () => {
		const css = await buildExportCss(
			['bg-brand'],
			theme,
			undefined,
			'',
			tokens
		)
		expect(css).toContain('--color-brand')
		expect(css).not.toContain('--spacing-section')
		expect(css).not.toContain('.py-section')
	})

	it('refreshes when tokens change', async () => {
		const builder = new CssBuilder()
		await builder.build(['bg-brand'], theme, undefined, tokens)
		const next = [{ ...tokens[0], value: '#00ff00' }]
		const css = await builder.build(['bg-brand'], theme, undefined, next)
		expect(css).toContain('--color-brand: #00ff00')
		expect(css).not.toContain('#ff0000')
	})
})

describe('token validation', () => {
	const site = (list: unknown) => ({
		version: 1,
		name: 'x',
		lang: 'en',
		pathPrefix: '',
		theme: { name: 'light', vars: {} },
		fonts: { heading: null, body: null },
		pages: [],
		tokens: list,
	})

	it('accepts a valid list and a missing one', () => {
		expect(() => assertSite(site(tokens))).not.toThrow()
		expect(() => assertSite(site(undefined))).not.toThrow()
	})

	it('rejects bad tokens', () => {
		const bad = [
			'nope',
			[{ name: 'primary', type: 'color', value: '#fff' }],
			[{ name: 'x', type: 'weight', value: '1' }],
			[{ name: 'x', type: 'spacing', value: '1rem; color: red' }],
			[tokens[0], tokens[0]],
		]
		for (const list of bad) {
			expect(() => assertSite(site(list))).toThrow(/site\.tokens/)
		}
	})

	it('rejects bad tokens on /api/css', async () => {
		const app = createApp()
		const res = await app.request('/api/css', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				classes: ['p-4'],
				theme,
				tokens: [{ name: 'sm', type: 'spacing', value: '1rem' }],
			}),
		})
		expect(res.status).toBe(400)
	})
})
