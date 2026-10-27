import presets from 'daisyui/theme/object.js'
import { autoContent, hexToOklch, parseOklch } from './color'

// Light and dark first, the rest alphabetically
export const PRESET_NAMES = [
	'light',
	'dark',
	...Object.keys(presets)
		.filter((name) => name !== 'light' && name !== 'dark')
		.sort(),
]

// Content color and the background it sits on
export const CONTENT_OF = {
	'base-content': 'base-100',
	'primary-content': 'primary',
	'secondary-content': 'secondary',
	'accent-content': 'accent',
	'neutral-content': 'neutral',
	'info-content': 'info',
	'success-content': 'success',
	'warning-content': 'warning',
	'error-content': 'error',
}

const VAR_KEYS = Object.keys(presets.light).filter((key) => key !== '--noise')

const colorVar = (key) => `--color-${key}`

export const createTheme = (preset = 'light', name = 'mytheme') => {
	const source = presets[preset] ?? presets.light
	const vars = Object.fromEntries(VAR_KEYS.map((key) => [key, source[key]]))
	const auto = Object.fromEntries(
		Object.keys(CONTENT_OF).map((k) => [k, true])
	)
	return { name, preset, vars, auto }
}

const withAutoContent = (vars, auto, changedKey) => {
	const next = { ...vars }
	for (const [content, bg] of Object.entries(CONTENT_OF)) {
		if (auto[content] && (!changedKey || bg === changedKey)) {
			next[colorVar(content)] = autoContent(next[colorVar(bg)])
		}
	}
	return next
}

export const getColor = (theme, key) => theme.vars[colorVar(key)]

// Updates a color, content colors on auto follow their background
export const setColor = (theme, key, value) => {
	const vars = { ...theme.vars, [colorVar(key)]: value }
	if (key in CONTENT_OF) {
		return { ...theme, vars, auto: { ...theme.auto, [key]: false } }
	}
	return { ...theme, vars: withAutoContent(vars, theme.auto, key) }
}

export const setAuto = (theme, contentKey, enabled) => {
	const auto = { ...theme.auto, [contentKey]: enabled }
	if (!enabled) return { ...theme, auto }
	const vars = {
		...theme.vars,
		[colorVar(contentKey)]: autoContent(
			theme.vars[colorVar(CONTENT_OF[contentKey])]
		),
	}
	return { ...theme, vars, auto }
}

export const setVar = (theme, key, value) => ({
	...theme,
	vars: { ...theme.vars, [key]: value },
})

// Inline style that scopes the theme to one element
export const themeStyle = (vars) => {
	const { 'color-scheme': colorScheme, ...rest } = vars
	return { ...rest, '--noise': '0', colorScheme }
}

export const themeCss = (
	theme,
	{ isDefault = false, prefersDark = false } = {}
) => {
	const lines = [
		`name: "${theme.name || 'mytheme'}";`,
		`default: ${isDefault};`,
		`prefersdark: ${prefersDark};`,
		...VAR_KEYS.map((key) => `${key}: ${theme.vars[key]};`),
		'--noise: 0;',
	]
	return `@plugin "daisyui/theme" {\n${lines.map((l) => `\t${l}`).join('\n')}\n}\n`
}

const toBase64Url = (text) =>
	btoa(String.fromCharCode(...new TextEncoder().encode(text)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')

const fromBase64Url = (text) =>
	new TextDecoder().decode(
		Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
			c.charCodeAt(0)
		)
	)

export const encodeTheme = (theme) => toBase64Url(JSON.stringify(theme))

// Returns null for anything that is not a valid theme
export const decodeTheme = (value) => {
	if (!value) return null
	try {
		const data = JSON.parse(fromBase64Url(value))
		const base = createTheme(data.preset, data.name)
		for (const key of VAR_KEYS) {
			if (typeof data.vars?.[key] === 'string')
				base.vars[key] = data.vars[key]
		}
		for (const key of Object.keys(base.auto)) {
			if (typeof data.auto?.[key] === 'boolean')
				base.auto[key] = data.auto[key]
		}
		return base
	} catch {
		return null
	}
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const expandHex = (hex) =>
	hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex

// Reads a theme back from CSS, a daisyUI plugin block or plain declarations
export const parseThemeCss = (text) => {
	const clean = text.replace(/\/\*[\s\S]*?\*\//g, '')
	const open = clean.indexOf('{')
	const body =
		open >= 0 ? clean.slice(open + 1, clean.lastIndexOf('}')) : clean
	const values = {}
	for (const declaration of body.split(';')) {
		const i = declaration.indexOf(':')
		if (i < 0) continue
		const key = declaration.slice(0, i).trim()
		values[key] = declaration
			.slice(i + 1)
			.trim()
			.replace(/^["']|["']$/g, '')
	}
	if (!Object.keys(values).some((key) => key.startsWith('--color-'))) {
		return null
	}

	const scheme = values['color-scheme'] === 'dark' ? 'dark' : 'light'
	// Name from the plugin block, or from a [data-theme=name] selector
	const selectorName = /data-theme\s*=\s*['"]?([\w-]+)/.exec(clean)?.[1]
	const name =
		(values.name ?? selectorName ?? '')
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '') || 'mytheme'
	const theme = createTheme(scheme, name)
	const skipped = []
	for (const key of VAR_KEYS) {
		const value = values[key]
		if (value === undefined) continue
		if (!key.startsWith('--color-')) theme.vars[key] = value
		else if (parseOklch(value)) theme.vars[key] = value
		else if (HEX.test(value)) theme.vars[key] = hexToOklch(expandHex(value))
		else skipped.push(key)
	}
	// Imported content colors are deliberate, keep them as they are
	theme.auto = Object.fromEntries(
		Object.keys(theme.auto).map((k) => [k, false])
	)
	return { theme, skipped }
}
