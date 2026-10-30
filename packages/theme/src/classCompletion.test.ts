import { describe, expect, it } from 'vitest'
import {
	annotateCss,
	classToken,
	classesFromRules,
	splitSelectorList,
	colorOf,
	resolveVars,
	themeVars,
} from './classCompletion'
import { loadClassIndex } from './tailwindClasses'

describe('classCompletion', () => {
	it('splits the variant prefix from the class being typed', () => {
		expect(classToken('btn md:hover:bg-re')).toEqual({
			prefix: 'md:hover:',
			base: 'bg-re',
		})
		expect(classToken('flex ')).toEqual({ prefix: '', base: '' })
		expect(classToken('[mask-type:lum')).toEqual({
			prefix: '',
			base: '[mask-type:lum',
		})
	})

	it('resolves theme variables', () => {
		const vars = themeVars(':root { --a: red; --b: var(--a); }')
		expect(resolveVars('var(--b)', vars)).toBe('red')
		expect(resolveVars('var(--unknown)', vars)).toBe('var(--unknown)')
	})

	it('finds the color a class paints with', () => {
		const vars = { '--color-red-500': 'oklch(63.7% 0.237 25.331)' }
		expect(
			colorOf(
				'.bg-red-500 {\n  background-color: var(--color-red-500);\n}',
				vars
			)
		).toBe('oklch(63.7% 0.237 25.331)')
		expect(colorOf('.p-4 {\n  padding: 1rem;\n}')).toBeNull()
		expect(colorOf('.text-current {\n  color: currentcolor;\n}')).toBeNull()
	})

	it('collects component classes the utilities do not cover', () => {
		const found = classesFromRules(
			[
				{ selector: '.btn', css: 'display: inline-flex;' },
				{ selector: '.btn:hover, .btn-soft', css: 'color: red;' },
				{ selector: '.sm\\:btn', css: 'display: inline-flex;' },
				{ selector: '.flex', css: 'display: flex;' },
				{ selector: '.max-h-\\[32rem\\]', css: 'max-height: 32rem;' },
			],
			new Set(['flex'])
		)
		expect([...found.keys()]).toEqual(['btn', 'btn-soft'])
		expect(found.get('btn')).toContain('display: inline-flex;')
		expect(found.get('btn-soft')).toBe('.btn-soft {\n  color: red;\n}')
	})

	it('reads grouped selectors and keeps :where() commas together', () => {
		const found = classesFromRules(
			[
				{
					selector: '.btn-outline,.btn-dash',
					css: 'border: 1px solid;',
				},
				{ selector: ':where(.a, .b) .x', css: 'color: red;' },
			],
			new Set()
		)
		expect(found.get('btn-outline')).toBe(
			'.btn-outline {\n  border: 1px solid;\n}'
		)
		expect(found.get('btn-dash')).toBe(
			'.btn-dash {\n  border: 1px solid;\n}'
		)
		expect(
			splitSelectorList(':where(.a, .b) .x, .y[data-a="1,2"]')
		).toEqual([':where(.a, .b) .x', '.y[data-a="1,2"]'])
	})

	it('falls back to rules mentioning a class without its own rule', () => {
		const found = classesFromRules(
			[
				{
					selector: '.card-sm .card-body',
					css: '--card-p: 1rem; gap: 1px;',
				},
				{
					selector: '.btn:disabled, .btn-disabled, .x',
					css: 'opacity: 0.5;',
				},
				{ selector: '.empty .card-sm', css: '' },
			],
			new Set()
		)
		expect(found.get('card-sm')).toBe(
			'.card-sm .card-body {\n  --card-p: 1rem;\n  gap: 1px;\n}'
		)
		expect(found.get('btn-disabled')).toBe(
			'.btn-disabled {\n  opacity: 0.5;\n}'
		)
		expect(found.get('empty')).toBe(
			'.empty .card-sm {\n}'.slice(0, 0) || null
		)
	})

	it('caps fallback previews', () => {
		const rules = Array.from({ length: 8 }, (_, i) => ({
			selector: `.big .part${i}`,
			css: Array.from({ length: 10 }, (_, j) => `p${j}: ${i}`).join('; '),
		}))
		const css = classesFromRules(rules, new Set()).get('big') ?? ''
		expect(css.match(/\{/g)).toHaveLength(2)
		expect(css.match(/;/g)).toHaveLength(20)
	})

	it('shows previews without wrapping them twice', async () => {
		const index = await loadClassIndex(
			[],
			[{ name: 'btn-md', css: '.btn-md {\n  --btn-p: 1rem;\n}' }]
		)
		expect(index.cssOf('btn-md')).toBe('.btn-md {\n  --btn-p: 1rem;\n}')
	})

	it('notes resolved values next to variables', () => {
		expect(
			annotateCss('  color: var(--c);', { '--c': 'oklch(50% 0 0)' })
		).toBe('  color: var(--c); /* oklch(50% 0 0) */')
	})

	it('loads Tailwind classes, variants and daisyUI colors', async () => {
		const index = await loadClassIndex([
			{ selector: '.btn', css: 'display: inline-flex;' },
		])
		expect(index.utilities).toContain('bg-red-500')
		expect(index.utilities).toContain('bg-primary')
		expect(index.components).toEqual(['btn'])
		expect(index.variants).toEqual(
			expect.arrayContaining(['hover', 'md', 'group-hover', 'dark'])
		)
		expect(index.colorOf('bg-red-500')).toMatch(/^oklch\(/)
		expect(index.colorOf('text-primary')).toBe('var(--color-primary)')
		expect(index.cssOf('p-4')).toContain('padding')
	})
})
