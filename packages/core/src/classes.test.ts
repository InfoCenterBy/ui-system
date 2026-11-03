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
	usedStates,
	hasGroupClass,
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
		expect(groupOf('justify-center')).toBe('justify-content')
		expect(groupOf('justify-items-center')).toBe('justify-items')
		expect(groupOf('place-items-center')).toBe('place-items')
		expect(groupOf('self-center')).toBe('align-self')
		expect(groupOf('justify-self-end')).toBe('justify-self')
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
			state: '',
		})
		expect(resolveUtility(classes, 'font-size', 'md')).toEqual({
			utility: 'text-lg',
			from: '',
			state: '',
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

	it('reads and writes variant chains of breakpoint and state', () => {
		const classes = 'p-2 hover:p-4 md:hover:p-6 md:p-3'
		expect(getUtility(classes, 'padding', '', 'hover')).toBe('p-4')
		expect(getUtility(classes, 'padding', 'md', 'hover')).toBe('p-6')
		expect(getUtility(classes, 'padding', 'md')).toBe('p-3')
		expect(setUtility(classes, 'padding', 'md', 'p-8', 'hover')).toBe(
			'p-2 hover:p-4 md:hover:p-8 md:p-3'
		)
		expect(setUtility('p-2', 'padding', 'md', 'p-8', 'focus')).toBe(
			'p-2 md:focus:p-8'
		)
		expect(setUtility(classes, 'padding', 'md', null, 'hover')).toBe(
			'p-2 hover:p-4 md:p-3'
		)
	})

	it('resolves a state to its own value or the base value', () => {
		expect(
			resolveUtility('p-2 hover:p-4', 'padding', 'md', 'hover')
		).toEqual({ utility: 'p-4', from: '', state: 'hover' })
		expect(resolveUtility('p-2 md:p-3', 'padding', 'md', 'hover')).toEqual({
			utility: 'p-3',
			from: 'md',
			state: '',
		})
		expect(resolveUtility('bg-primary', 'padding', '', 'hover')).toBeNull()
	})

	it('lists the states in use', () => {
		expect(usedStates('p-2 md:hover:p-4 focus:bg-primary')).toEqual([
			'hover',
			'focus',
		])
		expect(usedStates('p-2 md:p-4')).toEqual([])
	})

	it('sorts the new groups', () => {
		expect(groupOf('italic')).toBe('font-style')
		expect(groupOf('tracking-wide')).toBe('letter-spacing')
		expect(groupOf('uppercase')).toBe('text-transform')
		expect(groupOf('absolute')).toBe('position')
		expect(groupOf('-top-2')).toBe('top')
		expect(groupOf('z-10')).toBe('z-index')
		expect(groupOf('overflow-x-auto')).toBe('overflow-x')
		expect(groupOf('aspect-video')).toBe('aspect-ratio')
		expect(groupOf('object-cover')).toBe('object-fit')
		expect(groupOf('object-left-top')).toBe('object-position')
		expect(groupOf('border')).toBe('border-width')
		expect(groupOf('border-2')).toBe('border-width')
		expect(groupOf('border-dashed')).toBe('border-style')
		expect(groupOf('border-primary/50')).toBe('border-color')
		expect(groupOf('bg-linear-to-br')).toBe('gradient-direction')
		expect(groupOf('from-primary')).toBe('gradient-from')
		expect(groupOf('via-red-500')).toBe('gradient-via')
		expect(groupOf('to-secondary')).toBe('gradient-to')
		expect(groupOf('font-heading')).toBe('font-family')
	})
	it('sorts motion utilities and finds the group marker', () => {
		expect(groupOf('transition')).toBe('transition')
		expect(groupOf('transition-colors')).toBe('transition')
		expect(groupOf('duration-200')).toBe('duration')
		expect(groupOf('ease-in-out')).toBe('ease')
		expect(groupOf('delay-75')).toBe('delay')
		expect(groupOf('scale-105')).toBe('scale')
		expect(groupOf('scale-x-50')).toBe(null)
		expect(groupOf('-translate-y-1')).toBe('translate-y')
		expect(groupOf('-rotate-3')).toBe('rotate')
		expect(hasGroupClass('card group p-4')).toBe(true)
		expect(hasGroupClass('group-hover:underline')).toBe(false)
	})
})
