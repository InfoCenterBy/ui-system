import { describe, expect, it } from 'vitest'
import {
	SPACING_STEPS,
	arbitraryValue,
	colorUtility,
	customColorUtility,
	hexForPicker,
	normalizeHex,
	parseCustomColor,
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

describe('px and rem values', () => {
	const steps = ['0', '1', '2']
	it('accepts px and rem as arbitrary values', () => {
		expect(parseValueInput('10px', steps)).toBe('[10px]')
		expect(parseValueInput('1.5rem', steps)).toBe('[1.5rem]')
		expect(joinPrefix('p', parseValueInput('10px', steps)!)).toBe(
			'p-[10px]'
		)
	})
	it('allows negative lengths only when asked', () => {
		expect(parseValueInput('-8px', steps)).toBeNull()
		const v = parseValueInput('-8px', steps, true)
		expect(v).toBe('-[8px]')
		expect(joinPrefix('m', v!)).toBe('-m-[8px]')
		expect(stripPrefix('-m-[8px]', 'm')).toBe('-[8px]')
		expect(parseValueInput('-2', steps, true)).toBe('-2')
	})
})

describe('custom colors', () => {
	it('normalizes hex', () => {
		expect(normalizeHex('#1E90FF')).toBe('#1e90ff')
		expect(normalizeHex('1e90ff')).toBe('#1e90ff')
		expect(normalizeHex('#abc')).toBe('#abc')
		expect(normalizeHex('#12')).toBeNull()
		expect(normalizeHex('red')).toBeNull()
	})
	it('builds and parses arbitrary color classes', () => {
		expect(customColorUtility('bg', '#1e90ff')).toBe('bg-[#1e90ff]')
		expect(parseCustomColor('text-[#1e90ff]', 'text')).toBe('#1e90ff')
		expect(parseCustomColor('bg-[#1e90ff]', 'text')).toBeNull()
		expect(parseCustomColor('bg-primary', 'bg')).toBeNull()
		expect(parseCustomColor('bg-[10px]', 'bg')).toBeNull()
	})
	it('expands short hex for the picker', () => {
		expect(hexForPicker('#abc')).toBe('#aabbcc')
		expect(hexForPicker('#11223344')).toBe('#112233')
	})
})
