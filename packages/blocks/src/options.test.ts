import { describe, expect, it } from 'vitest'
import {
	componentOptions,
	currentOption,
	optionsFor,
	setOption,
} from './options'

const option = (component: string, id: string) =>
	componentOptions
		.find((c) => c.component === component)!
		.options.find((o) => o.id === id)!

describe('optionsFor', () => {
	it('finds components by plain base class', () => {
		expect(optionsFor('btn btn-primary').map((c) => c.component)).toEqual([
			'btn',
		])
		expect(optionsFor('p-4 flex')).toEqual([])
	})

	it('ignores prefixed base classes', () => {
		expect(optionsFor('md:btn')).toEqual([])
	})

	it('can match several components', () => {
		expect(optionsFor('card mask').map((c) => c.component)).toEqual([
			'card',
			'mask',
		])
	})
})

describe('currentOption', () => {
	const color = option('btn', 'color')
	it('returns the plain value', () => {
		expect(currentOption('btn btn-primary', color)).toBe('btn-primary')
	})
	it('returns null when absent or only prefixed', () => {
		expect(currentOption('btn', color)).toBeNull()
		expect(currentOption('btn md:btn-primary', color)).toBeNull()
	})
})

describe('setOption', () => {
	const size = option('btn', 'size')
	it('appends when absent', () => {
		expect(setOption('btn btn-primary', size, 'btn-lg')).toBe(
			'btn btn-primary btn-lg'
		)
	})
	it('replaces in place', () => {
		expect(setOption('btn btn-sm p-2', size, 'btn-lg')).toBe(
			'btn btn-lg p-2'
		)
	})
	it('removes with null', () => {
		expect(setOption('btn btn-sm p-2', size, null)).toBe('btn p-2')
	})
	it('leaves prefixed classes untouched', () => {
		expect(
			setOption('btn md:btn-lg hover:btn-sm btn-xs', size, 'btn-md')
		).toBe('btn md:btn-lg hover:btn-sm btn-md')
	})
	it('toggles single values', () => {
		const open = option('tooltip', 'open')
		expect(setOption('tooltip', open, 'tooltip-open')).toBe(
			'tooltip tooltip-open'
		)
		expect(setOption('tooltip tooltip-open', open, null)).toBe('tooltip')
	})
})

describe('table', () => {
	it('has no duplicate classes within a component', () => {
		for (const c of componentOptions) {
			const all = c.options.flatMap((o) => o.values)
			expect(new Set(all).size, c.component).toBe(all.length)
		}
	})
	it('has unique components', () => {
		const names = componentOptions.map((c) => c.component)
		expect(new Set(names).size).toBe(names.length)
	})
})
