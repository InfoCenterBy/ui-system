import { describe, expect, it } from 'vitest'
import {
	PRESET_NAMES,
	createTheme,
	decodeTheme,
	encodeTheme,
	getColor,
	setAuto,
	setColor,
	setVar,
	themeCss,
	themeStyle,
} from './theme'

describe('theme', () => {
	it('lists daisyUI presets with light and dark first', () => {
		expect(PRESET_NAMES.slice(0, 2)).toEqual(['light', 'dark'])
		expect(PRESET_NAMES.length).toBeGreaterThan(30)
	})

	it('starts from a preset without noise', () => {
		const theme = createTheme('dark')
		expect(theme.vars['color-scheme']).toBe('dark')
		expect(theme.vars['--noise']).toBeUndefined()
	})

	it('recomputes content on auto when the background changes', () => {
		const theme = setColor(createTheme(), 'primary', 'oklch(90% 0.1 100)')
		expect(getColor(theme, 'primary')).toBe('oklch(90% 0.1 100)')
		expect(getColor(theme, 'primary-content')).not.toBe(
			getColor(createTheme(), 'primary-content')
		)
	})

	it('keeps manual content and turns auto off', () => {
		let theme = setColor(createTheme(), 'primary-content', 'oklch(10% 0 0)')
		expect(theme.auto['primary-content']).toBe(false)
		theme = setColor(theme, 'primary', 'oklch(90% 0.1 100)')
		expect(getColor(theme, 'primary-content')).toBe('oklch(10% 0 0)')
		theme = setAuto(theme, 'primary-content', true)
		expect(getColor(theme, 'primary-content')).not.toBe('oklch(10% 0 0)')
	})

	it('round-trips through the URL encoding', () => {
		const theme = setVar(
			setColor(
				createTheme('cupcake', 'брендовая'),
				'accent',
				'oklch(60% 0.2 30)'
			),
			'--radius-box',
			'2rem'
		)
		expect(decodeTheme(encodeTheme(theme))).toEqual(theme)
	})

	it('rejects broken input', () => {
		expect(decodeTheme('not-a-theme')).toBeNull()
		expect(decodeTheme('')).toBeNull()
	})

	it('exports a daisyUI theme plugin block', () => {
		const css = themeCss(createTheme('light', 'brand'), {
			prefersDark: true,
		})
		expect(css).toMatch(/^@plugin "daisyui\/theme" \{/)
		expect(css).toContain('name: "brand";')
		expect(css).toContain('prefersdark: true;')
		expect(css).toContain('--color-primary: oklch(')
		expect(css).toContain('--radius-box: 0.5rem;')
		expect(css.trim().endsWith('}')).toBe(true)
	})

	it('builds an inline style with color-scheme', () => {
		const style = themeStyle(createTheme('dark').vars)
		expect(style.colorScheme).toBe('dark')
		expect(style['--color-base-100']).toMatch(/^oklch/)
	})
})
