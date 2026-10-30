// Pure helpers that map control values to Tailwind utilities and back

import { oklchToHex } from '@ui-system/theme'

export const SPACING_STEPS = [
	'0',
	'0.5',
	'1',
	'1.5',
	'2',
	'3',
	'4',
	'5',
	'6',
	'8',
	'10',
	'12',
	'16',
	'20',
	'24',
	'32',
] as const

export const FRACTIONS = ['1/2', '1/3', '2/3', '1/4', '3/4'] as const

export const COLOR_TOKENS = [
	'primary',
	'secondary',
	'accent',
	'neutral',
	'info',
	'success',
	'warning',
	'error',
	'base-100',
	'base-200',
	'base-300',
	'base-content',
	'primary-content',
	'secondary-content',
	'accent-content',
	'neutral-content',
	'info-content',
	'success-content',
	'warning-content',
	'error-content',
] as const

export const OPACITY_STEPS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10] as const

// "p-4" with prefix "p" gives "4", "-m-2" with prefix "m" gives "-2"
export const stripPrefix = (utility: string, prefix: string) => {
	if (utility.startsWith(`${prefix}-`))
		return utility.slice(prefix.length + 1)
	if (utility.startsWith(`-${prefix}-`)) {
		return `-${utility.slice(prefix.length + 2)}`
	}
	return null
}

export const joinPrefix = (prefix: string, value: string) =>
	value.startsWith('-')
		? `-${prefix}-${value.slice(1)}`
		: `${prefix}-${value}`

const LENGTH =
	/^(-?)(\d+\.?\d*|\.\d+)(px|rem|em|%|vw|vh|vmin|vmax|ch|svh|dvh)?$/

// "18px" becomes "[18px]", a bare number counts as pixels
export const arbitraryValue = (input: string) => {
	const text = input.trim()
	if (/^-?\[[^\]\s]+\]$/.test(text)) return text
	const match = LENGTH.exec(text)
	if (!match) return null
	return `${match[1]}[${match[2]}${match[3] ?? 'px'}]`
}

// Value typed into a combo field: a known step or keyword, or an arbitrary length
export const parseValueInput = (
	input: string,
	allowed: readonly string[],
	negative = false
) => {
	const text = input.trim()
	if (allowed.includes(text)) return text
	if (text.startsWith('-') && !negative) return null
	if (negative && text.startsWith('-')) {
		const rest = text.slice(1)
		if (allowed.includes(rest) && /^\d/.test(rest)) return text
	}
	return arbitraryValue(text)
}

export interface ColorValue {
	token: string
	opacity: number | null
}

export const colorUtility = (
	prefix: string,
	token: string,
	opacity: number | null = null
) => `${prefix}-${token}${opacity === null ? '' : `/${opacity}`}`

// "text-primary/70" with prefix "text" gives token primary and opacity 70
export const parseColorUtility = (
	utility: string,
	prefix: string
): ColorValue | null => {
	const rest = stripPrefix(utility, prefix)
	if (!rest) return null
	const [token, opacity] = rest.split('/')
	return { token, opacity: opacity ? Number(opacity) : null }
}

export const isColorToken = (token: string) =>
	(COLOR_TOKENS as readonly string[]).includes(token)

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

// "#1E90FF" or "1e90ff" gives "#1e90ff", other text gives null
export const normalizeHex = (input: string) => {
	const text = input.trim()
	const hex = text.startsWith('#') ? text : `#${text}`
	return HEX.test(hex) ? hex.toLowerCase() : null
}

const COLOR_FN =
	/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\(.+\)$/i

// Text for the class field: "rgb(30 144 255)" and "color:var(--x)" are kept
// as typed, hex is lowercased, anything that is not a color gives null
export const normalizeColor = (input: string) => {
	const text = input.trim()
	const hex = normalizeHex(text)
	if (hex) return text.startsWith('#') ? hex : null
	const hint = /^color:/i.test(text)
	const body = hint ? text.slice(6).trim() : text
	if (hint ? body : COLOR_FN.test(body)) return hint ? `color:${body}` : body
	return null
}

// "bg" and "#1e90ff" give "bg-[#1e90ff]", spaces become underscores
export const customColorUtility = (prefix: string, color: string) =>
	`${prefix}-[${color.trim().replace(/\s+/g, '_')}]`

// "bg-[oklch(60%_0.2_250)]" with prefix "bg" gives "oklch(60% 0.2 250)"
export const parseCustomColor = (utility: string, prefix: string) => {
	const rest = stripPrefix(utility, prefix)
	const match = rest && /^\[(.+)\]$/.exec(rest)
	if (!match) return null
	return normalizeColor(match[1].replace(/_/g, ' '))
}

// CSS for a custom color text, without the "color:" type hint
export const customColorCss = (color: string) => color.replace(/^color:/i, '')

// "bg-red-500/50" with prefix "bg" gives "red-500/50", daisy tokens give null
export const parsePaletteColor = (utility: string, prefix: string) => {
	const rest = stripPrefix(utility, prefix)
	return rest && /^[a-z]+-\d{2,3}(\/\d+)?$/.test(rest) ? rest : null
}

// "red-500" and "bg" give "bg-red-500", other text gives null
export const paletteUtility = (prefix: string, name: string) =>
	/^[a-z]+-\d{2,3}(\/\d+)?$/.test(name.trim())
		? `${prefix}-${name.trim()}`
		: null

// Color input needs #rrggbb, so any CSS color is converted when possible
export const colorForPicker = (css: string) => {
	const hex = normalizeHex(css)
	if (hex) return hexForPicker(hex)
	if (/^oklch\(/i.test(css)) return oklchToHex(css)
	if (typeof document === 'undefined') return null
	// The canvas parses rgb, hsl and the like and returns #rrggbb or rgba()
	const ctx = document.createElement('canvas').getContext('2d')
	if (!ctx) return null
	ctx.fillStyle = '#000001'
	ctx.fillStyle = css
	const out = ctx.fillStyle
	if (out === '#000001') return null
	if (out.startsWith('#')) return out
	const rgb = /\d+(\.\d+)?/g
	const nums = out.match(rgb)?.slice(0, 3).map(Number)
	if (!nums || nums.length < 3) return null
	return `#${nums.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`
}

// Color input needs #rrggbb, shorter forms are expanded and alpha is dropped
export const hexForPicker = (hex: string) => {
	if (hex.length === 4) {
		return `#${[...hex.slice(1)].map((c) => c + c).join('')}`
	}
	return hex.slice(0, 7)
}
