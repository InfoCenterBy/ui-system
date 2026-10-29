import { describe, expect, it } from 'vitest'
import { createApp } from './app'
import { componentClasses, parseRules } from './classes'

const SAMPLE = String.raw`/*! daisyUI */ @layer components{.btn{display:inline-flex;padding:calc(var(--s)*2);&:hover{color:red}}.btn-primary{background-color:var(--color-primary)}.btn:hover,.btn-soft{color:blue}}@media (min-width:640px){.sm\:btn{display:flex}}@keyframes spin{to{transform:rotate(1turn)}}`

describe('parseRules', () => {
	it('reads rules inside at-rules and skips keyframes', () => {
		const rules = parseRules(SAMPLE)
		expect(rules.map((r) => r.selector)).toEqual([
			'.btn',
			'.btn-primary',
			'.btn:hover,.btn-soft',
			String.raw`.sm\:btn`,
		])
	})

	it('keeps own declarations and drops nested rules', () => {
		const [btn] = parseRules(SAMPLE)
		expect(btn.css).toBe('display: inline-flex; padding: calc(var(--s)*2)')
	})
})

describe('componentClasses', () => {
	it('lists classes with their CSS', () => {
		const list = componentClasses(SAMPLE)
		expect(list.map((c) => c.name)).toEqual([
			'btn',
			'btn-primary',
			'btn-soft',
		])
		expect(list[0].css).toContain('display: inline-flex;')
		expect(list[2].css).toBe('')
	})
})

describe('GET /api/classes/components', () => {
	it('serves daisyUI component classes from the installed package', async () => {
		const app = createApp()
		const res = await app.request('/api/classes/components')
		expect(res.status).toBe(200)
		const list = (await res.json()) as { name: string; css: string }[]
		const names = list.map((c) => c.name)
		expect(names).toEqual(expect.arrayContaining(['btn', 'card', 'badge']))
		expect(list.find((c) => c.name === 'btn')?.css).toContain('display')
		const again = await app.request('/api/classes/components')
		expect(await again.json()).toEqual(list)
	})
})
