import { describe, expect, it } from 'vitest'
import { overriddenAt, targetHint, targetLabel } from './target'

describe('overriddenAt', () => {
	it('finds a larger breakpoint class winning on the canvas', () => {
		expect(overriddenAt('xl:p-8', 'padding', '', 'xl')).toBe('xl')
		expect(overriddenAt('p-2 md:p-4 xl:p-8', 'padding', 'md', 'xl')).toBe(
			'xl'
		)
	})
	it('is null when nothing larger applies', () => {
		expect(overriddenAt('p-2', 'padding', '', 'xl')).toBeNull()
		expect(overriddenAt('xl:p-8', 'padding', '', 'md')).toBeNull()
		expect(overriddenAt('xl:p-8', 'padding', 'xl', 'xl')).toBeNull()
		expect(overriddenAt('xl:p-8', 'padding', 'xl', '')).toBeNull()
		expect(overriddenAt('xl:bg-primary', 'padding', '', 'xl')).toBeNull()
	})
})

describe('target text', () => {
	it('labels', () => {
		expect(targetLabel('')).toBe('All screens')
		expect(targetLabel('md')).toBe('From md')
	})
	it('hints', () => {
		expect(targetHint('', 375).warn).toBe(false)
		expect(targetHint('xl', 375)).toEqual({
			text: 'Not visible at the current canvas width',
			warn: true,
		})
		expect(targetHint('md', 1280).text).toContain('md and wider')
	})
})

describe('overriddenAt in a state', () => {
	it('only counts state classes', () => {
		expect(overriddenAt('md:p-4', 'padding', '', 'md', 'hover')).toBeNull()
		expect(overriddenAt('md:hover:p-4', 'padding', '', 'md', 'hover')).toBe(
			'md'
		)
	})
})
