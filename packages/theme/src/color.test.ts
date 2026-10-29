import { describe, expect, it } from 'vitest'
import presets from 'daisyui/theme/object.js'
import {
	autoContent,
	contrastRatio,
	formatOklch,
	hexToOklch,
	oklchToHex,
	parseOklch,
} from './color'

describe('color', () => {
	it('parses percent and plain lightness', () => {
		expect(parseOklch('oklch(45% 0.24 277.023)')).toEqual({
			l: 0.45,
			c: 0.24,
			h: 277.023,
		})
		expect(parseOklch('oklch(0.5 0.1 20)')).toEqual({
			l: 0.5,
			c: 0.1,
			h: 20,
		})
		expect(parseOklch('red')).toBeNull()
	})

	it('formats with rounded values', () => {
		expect(formatOklch({ l: 0.456789, c: 0.12345, h: 200.12345 })).toBe(
			'oklch(45.68% 0.123 200.123)'
		)
	})

	it('maps black and white exactly', () => {
		expect(oklchToHex('oklch(0% 0 0)')).toBe('#000000')
		expect(oklchToHex('oklch(100% 0 0)')).toBe('#ffffff')
		expect(hexToOklch('#ffffff')).toBe('oklch(100% 0 0)')
	})

	it.each(['#ff0000', '#00ff00', '#1e90ff', '#808080', '#f5deb3'])(
		'round-trips %s through oklch',
		(hex) => {
			expect(oklchToHex(hexToOklch(hex))).toBe(hex)
		}
	)

	it('clips out of gamut colors instead of failing', () => {
		expect(oklchToHex('oklch(70% 0.4 150)')).toMatch(/^#[0-9a-f]{6}$/)
	})

	it('measures WCAG contrast', () => {
		expect(contrastRatio('oklch(0% 0 0)', 'oklch(100% 0 0)')).toBeCloseTo(
			21
		)
		expect(contrastRatio('oklch(50% 0 0)', 'oklch(50% 0 0)')).toBeCloseTo(1)
	})

	it('picks readable content for every preset color', () => {
		for (const theme of Object.values(presets)) {
			for (const [key, value] of Object.entries(theme)) {
				if (!key.startsWith('--color-') || key.endsWith('content'))
					continue
				expect(
					contrastRatio(value, autoContent(value))
				).toBeGreaterThanOrEqual(4.5)
			}
		}
	})
})
