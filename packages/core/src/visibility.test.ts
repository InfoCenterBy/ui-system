import { describe, expect, it } from 'vitest'
import { readVisibility, setVisibility } from './visibility'

const all = { phone: true, tablet: true, desktop: true }

describe('visibility', () => {
	it('writes the fewest classes', () => {
		expect(setVisibility('p-4', { ...all, phone: false })).toBe(
			'p-4 hidden md:block'
		)
		expect(setVisibility('flex p-4', { ...all, phone: false })).toBe(
			'p-4 hidden md:flex'
		)
		expect(setVisibility('p-4', { ...all, desktop: false })).toBe(
			'p-4 lg:hidden'
		)
		expect(setVisibility('grid', { ...all, tablet: false })).toBe(
			'grid md:hidden lg:grid'
		)
		expect(
			setVisibility('p-4', { phone: false, tablet: false, desktop: true })
		).toBe('p-4 hidden lg:block')
	})

	it('shows everywhere again without leftovers', () => {
		expect(setVisibility('p-4 hidden md:flex', all)).toBe('p-4 flex')
		expect(setVisibility('p-4 lg:hidden', all)).toBe('p-4')
	})

	it('reads back what it wrote', () => {
		for (const phone of [true, false])
			for (const tablet of [true, false])
				for (const desktop of [true, false]) {
					const v = { phone, tablet, desktop }
					const out = setVisibility('inline-flex m-2', v)
					expect(readVisibility(out)).toEqual(v)
					expect(setVisibility(out, v)).toBe(out)
				}
	})
})
