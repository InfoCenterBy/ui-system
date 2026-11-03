import { describe, expect, it } from 'vitest'
import { oklchToHex } from '@ui-system/theme'
import { toOklchString } from './parseColor'

const hex = (input: string) => {
	const out = toOklchString(input)
	return out && oklchToHex(out)
}

describe('toOklchString', () => {
	it('keeps oklch as typed', () => {
		expect(toOklchString(' oklch(50% 0.1 20) ')).toBe('oklch(50% 0.1 20)')
	})

	it('converts hex, short hex, rgb and hsl', () => {
		expect(hex('#e11d48')).toBe('#e11d48')
		expect(hex('#fff')).toBe('#ffffff')
		expect(hex('rgb(225, 29, 72)')).toBe('#e11d48')
		expect(hex('rgb(225 29 72 / 50%)')).toBe('#e11d48')
		expect(hex('hsl(0, 100%, 50%)')).toBe('#ff0000')
		expect(hex('hsl(120deg 100% 25%)')).toBe('#008000')
	})

	it('rejects anything else', () => {
		for (const bad of ['', 'red', '#12', '#ggg', 'rgb(1,2)', 'hsl(a b c)'])
			expect(toOklchString(bad)).toBeNull()
	})
})
