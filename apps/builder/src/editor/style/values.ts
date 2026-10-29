// Pure helpers that map control values to Tailwind utilities and back

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
