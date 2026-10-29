import type { Site } from '@ui-system/core'
import {
	CONTENT_OF,
	PRESET_NAMES,
	autoContent,
	createTheme,
	setAuto,
	setColor,
	setVar,
	type ContentKey,
	type Theme,
} from '@ui-system/theme'
import { useDocument } from '@/store/document'

export type SiteTheme = Site['theme']

const NOISE = '--noise'
const colorVar = (key: string) => `--color-${key}`

// Presets never set noise in createTheme, so its default is 0
const baseVars = (preset: string): Record<string, string> => ({
	...createTheme(preset).vars,
	[NOISE]: '0',
})

// A content color is manual when it is stored and differs from autoContent of its
// background, a stored value equal to the auto one counts as auto
const isManual = (
	vars: Theme['vars'],
	stored: SiteTheme['vars'],
	key: string
) => {
	const content = colorVar(key)
	const bg = colorVar(CONTENT_OF[key as ContentKey])
	return content in stored && stored[content] !== autoContent(vars[bg])
}

export const themeFromSite = (siteTheme: SiteTheme): Theme => {
	const theme = createTheme(
		PRESET_NAMES.includes(siteTheme.name) ? siteTheme.name : 'light'
	)
	const vars = { ...theme.vars, ...siteTheme.vars }
	const auto = Object.fromEntries(
		Object.keys(CONTENT_OF).map((key) => [
			key,
			!isManual(vars, siteTheme.vars, key),
		])
	) as Theme['auto']
	return { ...theme, vars, auto }
}

// Stores only the values that differ from the preset
export const siteThemeFrom = (theme: Theme, preset: string): SiteTheme => {
	const base = baseVars(preset)
	const vars = Object.fromEntries(
		Object.entries(theme.vars).filter(([key, value]) => base[key] !== value)
	)
	return { name: preset, vars }
}

const sameVars = (a: SiteTheme, b: SiteTheme) =>
	a.name === b.name && JSON.stringify(a.vars) === JSON.stringify(b.vars)

const update = (
	label: string,
	change: (theme: Theme) => Theme,
	mergeKey?: string
) =>
	useDocument.getState().edit(
		label,
		(draft) => {
			const current = draft.site.theme
			const next = siteThemeFrom(
				change(themeFromSite(current)),
				current.name
			)
			if (!sameVars(current, next)) draft.site.theme = next
		},
		{ mergeKey }
	)

export const setPreset = (name: string) =>
	useDocument.getState().edit('Change theme preset', (draft) => {
		if (!PRESET_NAMES.includes(name)) return
		draft.site.theme = { name, vars: {} }
	})

export const setThemeColor = (key: string, value: string) =>
	update(
		'Change theme color',
		(t) => setColor(t, key, value),
		`theme-color:${key}`
	)

export const setThemeAuto = (key: ContentKey) =>
	update('Auto content color', (t) => setAuto(t, key, true))

export const setThemeVar = (key: string, value: string) =>
	update('Change theme', (t) => setVar(t, key, value), `theme-var:${key}`)

// Sets auto content on every pair that fails the given check
export const setAutoFor = (keys: ContentKey[]) =>
	update('Fix low contrast', (t) =>
		keys.reduce((acc, key) => setAuto(acc, key, true), t)
	)

export const resetTheme = () =>
	useDocument.getState().edit('Reset theme', (draft) => {
		draft.site.theme = { name: draft.site.theme.name, vars: {} }
	})

// Imported values become overrides on the preset they match
export const importTheme = (theme: Theme) =>
	useDocument.getState().edit('Import theme', (draft) => {
		draft.site.theme = siteThemeFrom(theme, theme.preset)
	})
