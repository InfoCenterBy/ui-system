import { describe, expect, it } from 'vitest'
import {
	SPACING_STEPS,
	arbitraryValue,
	colorUtility,
	isColorToken,
	joinPrefix,
	parseColorUtility,
	parseValueInput,
	stripPrefix,
} from './values'

describe('spacing values', () => {
	it('maps utilities to values and back', () => {
		expect(stripPrefix('p-4', 'p')).toBe('4')
		expect(stripPrefix('px-4', 'p')).toBeNull()
		expect(stripPrefix('-m-2', 'm')).toBe('-2')
		expect(stripPrefix('max-w-xl', 'max-w')).toBe('xl')
		expect(joinPrefix('p', '4')).toBe('p-4')
		expect(joinPrefix('m', '-2')).toBe('-m-2')
		expect(joinPrefix('mt', '[18px]')).toBe('mt-[18px]')
	})

	it('turns typed lengths into arbitrary values', () => {
		expect(arbitraryValue('18px')).toBe('[18px]')
		expect(arbitraryValue(' 1.5rem ')).toBe('[1.5rem]')
		expect(arbitraryValue('18')).toBe('[18px]')
		expect(arbitraryValue('-12px')).toBe('-[12px]')
		expect(arbitraryValue('[calc(1px+2px)]')).toBe('[calc(1px+2px)]')
		expect(arbitraryValue('abc')).toBeNull()
		expect(arbitraryValue('')).toBeNull()
	})

	it('prefers known steps over arbitrary values', () => {
		const allowed = [...SPACING_STEPS, 'auto']
		expect(parseValueInput('4', allowed)).toBe('4')
		expect(parseValueInput('auto', allowed)).toBe('auto')
		expect(parseValueInput('18px', allowed)).toBe('[18px]')
		expect(parseValueInput('7', allowed)).toBe('[7px]')
		expect(parseValueInput('-4', allowed, true)).toBe('-4')
		expect(parseValueInput('-auto', allowed, true)).toBeNull()
		expect(parseValueInput('wat', allowed)).toBeNull()
		expect(joinPrefix('p', parseValueInput('18px', allowed) ?? '')).toBe(
			'p-[18px]'
		)
	})
})

describe('color values', () => {
	it('builds and parses color utilities', () => {
		expect(colorUtility('bg', 'primary')).toBe('bg-primary')
		expect(colorUtility('text', 'base-content', 70)).toBe(
			'text-base-content/70'
		)
		expect(parseColorUtility('text-base-content/70', 'text')).toEqual({
			token: 'base-content',
			opacity: 70,
		})
		expect(parseColorUtility('bg-base-200', 'bg')).toEqual({
			token: 'base-200',
			opacity: null,
		})
		expect(parseColorUtility('bg-base-200', 'text')).toBeNull()
	})

	it('knows daisyUI color tokens', () => {
		expect(isColorToken('primary')).toBe(true)
		expect(isColorToken('red-500')).toBe(false)
	})
})
