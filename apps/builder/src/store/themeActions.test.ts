import { beforeEach, describe, expect, it } from 'vitest'
import type { Site } from '@ui-system/core'
import { autoContent, createTheme, getColor } from '@ui-system/theme'
import { useDocument } from '@/store/document'
import {
	resetTheme,
	setPreset,
	setThemeColor,
	setThemeVar,
	siteThemeFrom,
	themeFromSite,
} from '@/store/themeActions'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'en',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: [],
}

const theme = () => useDocument.getState().doc?.site.theme

beforeEach(() => {
	useDocument
		.getState()
		.load({ path: '/p', site, pages: [], partials: {} } as never)
})

describe('theme data', () => {
	it('round-trips overrides through the diff', () => {
		const stored = { name: 'dark', vars: { '--radius-box': '2rem' } }
		expect(siteThemeFrom(themeFromSite(stored), 'dark')).toEqual(stored)
	})

	it('stores nothing for an untouched preset', () => {
		expect(siteThemeFrom(createTheme('cupcake'), 'cupcake').vars).toEqual(
			{}
		)
	})
})

describe('theme actions', () => {
	it('switching the preset clears overrides', () => {
		setThemeVar('--radius-box', '2rem')
		setPreset('dark')
		expect(theme()).toEqual({ name: 'dark', vars: {} })
	})

	it('content color follows a changed background', () => {
		const dark = 'oklch(20% 0.1 260)'
		setThemeColor('primary', dark)
		const current = themeFromSite(theme()!)
		expect(getColor(current, 'primary')).toBe(dark)
		expect(getColor(current, 'primary-content')).toBe(autoContent(dark))
		expect(current.auto['primary-content']).toBe(true)
	})

	it('a manual content color stays manual', () => {
		setThemeColor('primary-content', 'oklch(50% 0.2 30)')
		setThemeColor('primary', 'oklch(20% 0.1 260)')
		const current = themeFromSite(theme()!)
		expect(current.auto['primary-content']).toBe(false)
		expect(getColor(current, 'primary-content')).toBe('oklch(50% 0.2 30)')
	})

	it('dragging a color is one undo step', () => {
		for (const l of [30, 40, 50])
			setThemeColor('primary', `oklch(${l}% 0.1 260)`)
		useDocument.getState().undo()
		expect(theme()?.vars).toEqual({})
	})

	it('reset keeps the preset and drops overrides', () => {
		setPreset('dark')
		setThemeVar('--border', '2px')
		resetTheme()
		expect(theme()).toEqual({ name: 'dark', vars: {} })
	})
})
