// Site design tokens: named values that become Tailwind theme variables
import { parseClass, splitClasses } from './classes'

export const TOKEN_TYPES = [
	'color',
	'spacing',
	'radius',
	'font-size',
	'container',
] as const

export type TokenType = (typeof TOKEN_TYPES)[number]

export interface DesignToken {
	// Lowercase kebab name, the part after the utility prefix: bg-brand
	name: string
	type: TokenType
	// A CSS value, colors may be var(--color-primary) to follow the theme
	value: string
}

// Tailwind 4 theme namespace of each type: --color-brand, --text-lead
export const TOKEN_NAMESPACE: Record<TokenType, string> = {
	color: 'color',
	spacing: 'spacing',
	radius: 'radius',
	'font-size': 'text',
	container: 'container',
}

export const MAX_TOKENS = 200
export const MAX_TOKEN_NAME = 32

const SIDES = ['', '-x', '-y', '-t', '-r', '-b', '-l', '-s', '-e']
const withSides = (base: string) => SIDES.map((side) => `${base}${side}`)
const shortSides = (base: string) =>
	SIDES.map((side) => `${base}${side.slice(1)}`)

// Utilities that read each theme namespace
export const TOKEN_PREFIXES: Record<TokenType, readonly string[]> = {
	color: [
		'bg',
		'text',
		...withSides('border'),
		'divide',
		'ring',
		'ring-offset',
		'inset-ring',
		'outline',
		'accent',
		'caret',
		'fill',
		'stroke',
		'shadow',
		'inset-shadow',
		'drop-shadow',
		'text-shadow',
		'from',
		'via',
		'to',
		'decoration',
		'placeholder',
	],
	spacing: [
		...shortSides('p'),
		...shortSides('m'),
		'gap',
		'gap-x',
		'gap-y',
		'space-x',
		'space-y',
		'w',
		'h',
		'size',
		'min-w',
		'min-h',
		'max-w',
		'max-h',
		'inset',
		'inset-x',
		'inset-y',
		'top',
		'right',
		'bottom',
		'left',
		'start',
		'end',
		'translate',
		'translate-x',
		'translate-y',
		...shortSides('scroll-m'),
		...shortSides('scroll-p'),
		'basis',
		'indent',
		'leading',
	],
	radius: [
		'rounded',
		...['s', 'e', 't', 'r', 'b', 'l', 'ss', 'se', 'ee', 'es'].map(
			(side) => `rounded-${side}`
		),
		...['tl', 'tr', 'br', 'bl'].map((side) => `rounded-${side}`),
	],
	'font-size': ['text'],
	container: ['max-w', 'min-w', 'w', 'basis'],
}

const words = (text: string) => text.split(' ')

// Names Tailwind or daisyUI already use as a value of the same utilities
const RESERVED = new Set([
	...words(
		'inherit current transparent black white slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose'
	),
	...words(
		'primary secondary accent info success warning error base base-100 base-200 base-300 base-content'
	),
	...words(
		'primary-content secondary-content accent-content neutral-content info-content success-content warning-content error-content'
	),
	...words(
		'3xs 2xs xs sm md lg xl 2xl 3xl 4xl 5xl 6xl 7xl 8xl 9xl none full auto px screen min max fit prose box field selector'
	),
	...words(
		'left right center justify start end wrap nowrap balance pretty ellipsis clip'
	),
	...words(
		'normal tight snug relaxed loose thin light medium bold solid dashed dotted double hidden linear radial conic'
	),
	...words('top bottom lh svh dvh lvh svw dvw lvw'),
])

const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const LENGTH = /^(0|(\d+\.?\d*|\.\d+)(px|rem|em|vw|vh|svh|dvh|ch|%))$/
const LENGTH_FN = /^(clamp|calc|min|max)\([\w\s.,%+*/()-]+\)$/
const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
const THEME_VAR = /^var\(--color-[a-z][a-z0-9-]*\)$/
const COLOR_FN =
	/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color-mix)\([\w\s.,%/#()-]+\)$/i

const balanced = (text: string) => {
	let depth = 0
	for (const char of text) {
		if (char === '(') depth++
		else if (char === ')' && --depth < 0) return false
	}
	return depth === 0
}

export const isTokenType = (value: unknown): value is TokenType =>
	TOKEN_TYPES.includes(value as TokenType)

export type TokenIssue =
	| 'type'
	| 'format'
	| 'too-long'
	| 'reserved'
	| 'value'
	| 'duplicate'
	| 'count'

// The problem with a token name, null when it is fine
export const tokenNameIssue = (name: string): TokenIssue | null => {
	if (name.length > MAX_TOKEN_NAME) return 'too-long'
	if (!NAME.test(name)) return 'format'
	if (RESERVED.has(name)) return 'reserved'
	return null
}

// A color token may point to a theme color with var(--color-primary)
export const isThemeColorRef = (value: string) => THEME_VAR.test(value.trim())

export const tokenValueIssue = (
	type: TokenType,
	value: string
): TokenIssue | null => {
	const text = value.trim()
	if (!text || text.length > 120 || !balanced(text)) return 'value'
	if (type === 'color') {
		return THEME_VAR.test(text) || HEX.test(text) || COLOR_FN.test(text)
			? null
			: 'value'
	}
	return LENGTH.test(text) || LENGTH_FN.test(text) ? null : 'value'
}

// First problem of a token list, names must also be unique across types
export const tokensIssue = (
	tokens: readonly DesignToken[]
): { index: number; issue: TokenIssue } | null => {
	if (tokens.length > MAX_TOKENS) return { index: 0, issue: 'count' }
	const seen = new Set<string>()
	for (const [index, token] of tokens.entries()) {
		if (!isTokenType(token.type)) return { index, issue: 'type' }
		const issue =
			tokenNameIssue(token.name) ??
			(seen.has(token.name) ? 'duplicate' : null) ??
			tokenValueIssue(token.type, token.value)
		if (issue) return { index, issue }
		seen.add(token.name)
	}
	return null
}

// Theme CSS for Tailwind, theme color references are inlined so nested themes work
export const tokensCss = (tokens: readonly DesignToken[] = []) => {
	const plain: string[] = []
	const inline: string[] = []
	for (const { name, type, value } of tokens) {
		const line = `\t--${TOKEN_NAMESPACE[type]}-${name}: ${value.trim()};`
		const target =
			type === 'color' && isThemeColorRef(value) ? inline : plain
		target.push(line)
	}
	const block = (head: string, lines: string[]) =>
		lines.length ? `${head} {\n${lines.join('\n')}\n}\n` : ''
	return block('@theme', plain) + block('@theme inline', inline)
}

// Rebuilds a utility with another token name when it uses the token
const matchUtility = (
	utility: string,
	type: TokenType,
	name: string
): ((to: string) => string) | null => {
	let rest = utility
	const bang = rest.startsWith('!') ? '!' : ''
	rest = rest.slice(bang.length)
	const tail = rest.endsWith('!') ? '!' : ''
	rest = rest.slice(0, rest.length - tail.length)
	const neg = rest.startsWith('-') ? '-' : ''
	rest = rest.slice(neg.length)
	const slash = rest.indexOf('/')
	const mod = slash < 0 ? '' : rest.slice(slash)
	if (slash >= 0) rest = rest.slice(0, slash)
	if (/[[(]/.test(rest)) return null
	const prefix = TOKEN_PREFIXES[type].find((p) => rest === `${p}-${name}`)
	if (!prefix) return null
	return (to) => `${bang}${neg}${prefix}-${to}${mod}${tail}`
}

// Container query variants @name and @max-name read the container namespace
const matchVariant = (variant: string, name: string) => {
	if (variant === `@${name}`) return (to: string) => `@${to}`
	if (variant === `@max-${name}`) return (to: string) => `@max-${to}`
	return null
}

// The token a single class uses, variants and the modifier are ignored
export const tokenOfClass = (
	raw: string,
	tokens: readonly DesignToken[]
): DesignToken | null => {
	const { utility } = parseClass(raw)
	return (
		tokens.find((token) => matchUtility(utility, token.type, token.name)) ??
		null
	)
}

export const classUsesToken = (raw: string, type: TokenType, name: string) => {
	const { variants, utility } = parseClass(raw)
	if (matchUtility(utility, type, name)) return true
	return type === 'container' && variants.some((v) => matchVariant(v, name))
}

// Class list with the token renamed in every class that uses it
export const renameTokenInClasses = (
	classes: string,
	type: TokenType,
	from: string,
	to: string
) => {
	let changed = false
	const next = splitClasses(classes).map((raw) => {
		if (!classUsesToken(raw, type, from)) return raw
		const { variants, utility } = parseClass(raw)
		const parts = variants.map((v) => {
			const match = type === 'container' ? matchVariant(v, from) : null
			return match ? match(to) : v
		})
		parts.push(matchUtility(utility, type, from)?.(to) ?? utility)
		changed = true
		return parts.join(':')
	})
	return changed ? next.join(' ') : classes
}

// Class names offered in suggestions
export const tokenClassNames = (tokens: readonly DesignToken[]) =>
	tokens.flatMap(({ type, name }) =>
		TOKEN_PREFIXES[type].map((prefix) => `${prefix}-${name}`)
	)

// Non-color token names a utility prefix accepts: p gives spacing, text gives font sizes
export const tokenNamesFor = (tokens: readonly DesignToken[], prefix: string) =>
	tokens
		.filter(
			(token) =>
				token.type !== 'color' &&
				TOKEN_PREFIXES[token.type].includes(prefix)
		)
		.map((token) => token.name)
