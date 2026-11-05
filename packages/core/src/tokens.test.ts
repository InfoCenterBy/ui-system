import { describe, expect, it } from 'vitest'
import {
	classUsesToken,
	renameTokenInClasses,
	tokenClassNames,
	tokenNameIssue,
	tokenNamesFor,
	tokenOfClass,
	tokensCss,
	tokensIssue,
	tokenValueIssue,
	type DesignToken,
} from './tokens'

const brand: DesignToken = { name: 'brand', type: 'color', value: '#ff0000' }
const section: DesignToken = {
	name: 'section',
	type: 'spacing',
	value: '6rem',
}

describe('token names', () => {
	it('accepts lowercase kebab names', () => {
		expect(tokenNameIssue('brand')).toBeNull()
		expect(tokenNameIssue('brand-soft')).toBeNull()
		expect(tokenNameIssue('card2')).toBeNull()
	})

	it('rejects bad formats and built-in names', () => {
		expect(tokenNameIssue('Brand')).toBe('format')
		expect(tokenNameIssue('2col')).toBe('format')
		expect(tokenNameIssue('a--b')).toBe('format')
		expect(tokenNameIssue('')).toBe('format')
		expect(tokenNameIssue('primary')).toBe('reserved')
		expect(tokenNameIssue('sm')).toBe('reserved')
		expect(tokenNameIssue('base-100')).toBe('reserved')
		expect(tokenNameIssue('x'.repeat(40))).toBe('too-long')
	})
})

describe('token values', () => {
	it('checks colors', () => {
		for (const value of [
			'#fff',
			'#1e90ff',
			'oklch(60% 0.2 250)',
			'rgb(0 0 0 / 50%)',
			'var(--color-primary)',
		]) {
			expect(tokenValueIssue('color', value)).toBeNull()
		}
		for (const value of ['red', 'var(--x)', '#12', 'rgb(0;)', '']) {
			expect(tokenValueIssue('color', value)).toBe('value')
		}
	})

	it('checks lengths', () => {
		for (const value of [
			'0',
			'6rem',
			'1.5rem',
			'12px',
			'clamp(1rem, 2vw, 2rem)',
		]) {
			expect(tokenValueIssue('spacing', value)).toBeNull()
		}
		for (const value of [
			'6',
			'big',
			'1rem; color: red',
			'-2rem',
			'calc(1rem',
		]) {
			expect(tokenValueIssue('spacing', value)).toBe('value')
		}
	})
})

describe('tokensIssue', () => {
	it('finds duplicates across types', () => {
		const dup = { ...section, name: 'brand' }
		expect(tokensIssue([brand, dup])).toEqual({
			index: 1,
			issue: 'duplicate',
		})
	})

	it('reports the index of a bad token', () => {
		const bad = { ...section, value: 'x' }
		expect(tokensIssue([brand, bad])).toEqual({ index: 1, issue: 'value' })
		expect(tokensIssue([brand, section])).toBeNull()
	})
})

describe('tokensCss', () => {
	it('puts values into the theme namespaces', () => {
		const css = tokensCss([
			brand,
			section,
			{ name: 'card', type: 'radius', value: '1rem' },
			{ name: 'lead', type: 'font-size', value: '1.25rem' },
			{ name: 'content', type: 'container', value: '48rem' },
		])
		expect(css).toContain('@theme {')
		for (const line of [
			'--color-brand: #ff0000;',
			'--spacing-section: 6rem;',
			'--radius-card: 1rem;',
			'--text-lead: 1.25rem;',
			'--container-content: 48rem;',
		]) {
			expect(css).toContain(line)
		}
	})

	it('inlines theme color references', () => {
		const css = tokensCss([
			{ name: 'accent-bg', type: 'color', value: 'var(--color-primary)' },
		])
		expect(css).toBe(
			'@theme inline {\n\t--color-accent-bg: var(--color-primary);\n}\n'
		)
	})

	it('is empty without tokens', () => {
		expect(tokensCss()).toBe('')
	})
})

describe('class matching', () => {
	it('finds token classes with variants, opacity and negatives', () => {
		expect(classUsesToken('bg-brand', 'color', 'brand')).toBe(true)
		expect(classUsesToken('md:hover:bg-brand/50', 'color', 'brand')).toBe(
			true
		)
		expect(classUsesToken('border-t-brand', 'color', 'brand')).toBe(true)
		expect(classUsesToken('-mt-section', 'spacing', 'section')).toBe(true)
		expect(classUsesToken('!py-section', 'spacing', 'section')).toBe(true)
		expect(classUsesToken('bg-brand-soft', 'color', 'brand')).toBe(false)
		expect(classUsesToken('bg-[brand]', 'color', 'brand')).toBe(false)
		expect(classUsesToken('py-brand', 'color', 'brand')).toBe(false)
	})

	it('reads the token of a class', () => {
		expect(tokenOfClass('lg:py-section', [brand, section])).toBe(section)
		expect(tokenOfClass('p-4', [brand, section])).toBeNull()
	})

	it('renames in all prefixes', () => {
		expect(
			renameTokenInClasses(
				'flex bg-brand md:hover:bg-brand/50 text-brand p-4 from-brand',
				'color',
				'brand',
				'main'
			)
		).toBe('flex bg-main md:hover:bg-main/50 text-main p-4 from-main')
		expect(
			renameTokenInClasses(
				'-mt-section py-section',
				'spacing',
				'section',
				'gap2'
			)
		).toBe('-mt-gap2 py-gap2')
	})

	it('renames container query variants', () => {
		expect(
			renameTokenInClasses(
				'@content:flex max-w-content',
				'container',
				'content',
				'wrap'
			)
		).toBe('@wrap:flex max-w-wrap')
	})

	it('keeps the string when nothing matches', () => {
		const text = 'flex  p-4'
		expect(renameTokenInClasses(text, 'color', 'brand', 'main')).toBe(text)
	})
})

describe('suggestions', () => {
	it('lists class names per token', () => {
		const names = tokenClassNames([brand, section])
		expect(names).toContain('bg-brand')
		expect(names).toContain('py-section')
	})

	it('lists value names for a prefix without colors', () => {
		expect(tokenNamesFor([brand, section], 'py')).toEqual(['section'])
		expect(tokenNamesFor([brand, section], 'text')).toEqual([])
	})
})
