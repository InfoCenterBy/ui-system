import { describe, expect, it } from 'vitest'
import {
	addClass,
	breakpointFor,
	getUtility,
	groupOf,
	parseClass,
	removeClass,
	resolveUtility,
	setUtility,
} from './classes'

describe('classes', () => {
	it('maps canvas widths to breakpoints', () => {
		expect(breakpointFor(375)).toBe('')
		expect(breakpointFor(768)).toBe('md')
		expect(breakpointFor(1024)).toBe('lg')
		expect(breakpointFor(1280)).toBe('xl')
	})

	it('parses variants and keeps colons inside brackets', () => {
		expect(parseClass('md:hover:bg-red-500')).toEqual({
			raw: 'md:hover:bg-red-500',
			variants: ['md', 'hover'],
			utility: 'bg-red-500',
		})
		expect(parseClass('[mask-type:luminance]').variants).toEqual([])
	})

	it('sorts utilities into groups without mixing look-alikes', () => {
		expect(groupOf('p-4')).toBe('padding')
		expect(groupOf('px-4')).toBe('padding-x')
		expect(groupOf('-mt-2')).toBe('margin-top')
		expect(groupOf('text-lg')).toBe('font-size')
		expect(groupOf('text-center')).toBe('text-align')
		expect(groupOf('text-primary')).toBe('text-color')
		expect(groupOf('text-base-content/70')).toBe('text-color')
		expect(groupOf('text-red-500')).toBe('text-color')
		expect(groupOf('bg-base-200')).toBe('background-color')
		expect(groupOf('flex')).toBe('display')
		expect(groupOf('flex-col')).toBe('flex-direction')
		expect(groupOf('gap-x-4')).toBeNull()
		expect(groupOf('rounded-box')).toBe('radius')
		expect(groupOf('rounded-t-lg')).toBeNull()
		expect(groupOf('btn')).toBeNull()
	})

	it('reads a value at a breakpoint and the inherited one', () => {
		const classes = 'p-4 text-lg md:p-8 hover:p-2 lg:text-xl'
		expect(getUtility(classes, 'padding', '')).toBe('p-4')
		expect(getUtility(classes, 'padding', 'md')).toBe('p-8')
		expect(getUtility(classes, 'padding', 'lg')).toBeNull()
		expect(resolveUtility(classes, 'padding', 'lg')).toEqual({
			utility: 'p-8',
			from: 'md',
		})
		expect(resolveUtility(classes, 'font-size', 'md')).toEqual({
			utility: 'text-lg',
			from: '',
		})
		expect(resolveUtility(classes, 'margin', 'xl')).toBeNull()
	})

	it('sets, replaces in place and removes values per breakpoint', () => {
		let classes = 'card p-4 bg-base-200 hover:p-2'
		classes = setUtility(classes, 'padding', '', 'p-6')
		expect(classes).toBe('card p-6 bg-base-200 hover:p-2')
		classes = setUtility(classes, 'padding', 'md', 'p-10')
		expect(classes).toBe('card p-6 bg-base-200 hover:p-2 md:p-10')
		classes = setUtility(classes, 'padding', '', null)
		expect(classes).toBe('card bg-base-200 hover:p-2 md:p-10')
		expect(
			setUtility('text-lg text-primary', 'font-size', '', 'text-2xl')
		).toBe('text-2xl text-primary')
	})

	it('adds and removes raw classes', () => {
		expect(addClass('a b', 'c')).toBe('a b c')
		expect(addClass('a b', 'a')).toBe('a b')
		expect(removeClass('a  b c', 'b')).toBe('a c')
	})
})
