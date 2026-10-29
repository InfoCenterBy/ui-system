// Tailwind classes edited per breakpoint, mobile first like Tailwind itself

export const BREAKPOINTS = [
	{ prefix: '', min: 0, label: 'Base' },
	{ prefix: 'sm', min: 640, label: 'sm' },
	{ prefix: 'md', min: 768, label: 'md' },
	{ prefix: 'lg', min: 1024, label: 'lg' },
	{ prefix: 'xl', min: 1280, label: 'xl' },
	{ prefix: '2xl', min: 1536, label: '2xl' },
] as const

export type Breakpoint = (typeof BREAKPOINTS)[number]['prefix']

const BREAKPOINT_PREFIXES = new Set<string>(BREAKPOINTS.map((b) => b.prefix))

// The breakpoint whose styles apply at a canvas width
export const breakpointFor = (width: number): Breakpoint =>
	BREAKPOINTS.findLast((b) => width >= b.min)?.prefix ?? ''

export interface ClassToken {
	raw: string
	variants: string[]
	utility: string
}

// Splits "md:hover:bg-red-500" into variants and utility, brackets may hold colons
export const parseClass = (raw: string): ClassToken => {
	const variants: string[] = []
	let depth = 0
	let start = 0
	for (let i = 0; i < raw.length; i++) {
		const char = raw[i]
		if (char === '[' || char === '(') depth++
		else if (char === ']' || char === ')') depth = Math.max(0, depth - 1)
		else if (char === ':' && depth === 0) {
			variants.push(raw.slice(start, i))
			start = i + 1
		}
	}
	return { raw, variants, utility: raw.slice(start) }
}

export const splitClasses = (classes: string) =>
	classes.split(/\s+/).filter(Boolean)

const SIZE = '(?:xs|sm|base|lg|xl|[2-9]xl)'
const COLOR_WORDS =
	'(?:inherit|current|transparent|black|white|base-100|base-200|base-300|base-content|(?:primary|secondary|accent|neutral|info|success|warning|error)(?:-content)?|[a-z]+-\\d{2,3})'

// Each group holds utilities that override each other, at most one per breakpoint
export const UTILITY_GROUPS = {
	padding: /^p-/,
	'padding-x': /^px-/,
	'padding-y': /^py-/,
	'padding-top': /^pt-/,
	'padding-right': /^pr-/,
	'padding-bottom': /^pb-/,
	'padding-left': /^pl-/,
	margin: /^-?m-/,
	'margin-x': /^-?mx-/,
	'margin-y': /^-?my-/,
	'margin-top': /^-?mt-/,
	'margin-right': /^-?mr-/,
	'margin-bottom': /^-?mb-/,
	'margin-left': /^-?ml-/,
	width: /^w-/,
	'min-width': /^min-w-/,
	'max-width': /^max-w-/,
	height: /^h-/,
	'min-height': /^min-h-/,
	'max-height': /^max-h-/,
	display:
		/^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden|contents|flow-root)$/,
	'flex-direction': /^flex-(row|col)(-reverse)?$/,
	'flex-wrap': /^flex-(wrap|wrap-reverse|nowrap)$/,
	'justify-content':
		/^justify-(start|end|center|between|around|evenly|stretch|normal)$/,
	'align-items': /^items-(start|end|center|baseline|stretch)$/,
	gap: /^gap-(?!x-|y-)/,
	'grid-cols': /^grid-cols-/,
	'col-span': /^col-(span|start|end)-/,
	'font-size': new RegExp(`^text-(${SIZE}|\\[[^\\]]*(?:px|rem|em)\\])$`),
	'font-weight':
		/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
	'text-align': /^text-(left|center|right|justify|start|end)$/,
	'text-color': new RegExp(
		`^text-(${COLOR_WORDS}|\\[(?:#|oklch|rgb|hsl|var)[^\\]]*\\])(/\\d+)?$`
	),
	'line-height': /^leading-/,
	'background-color': new RegExp(
		`^bg-(${COLOR_WORDS}|\\[(?:#|oklch|rgb|hsl|var)[^\\]]*\\])(/\\d+)?$`
	),
	radius: /^rounded(-(none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|box|field|selector|\[[^\]]+\]))?$/,
	shadow: /^shadow(-(none|2xs|xs|sm|md|lg|xl|2xl|inner))?$/,
	opacity: /^opacity-/,
} as const satisfies Record<string, RegExp>

export type UtilityGroup = keyof typeof UTILITY_GROUPS

export const groupOf = (utility: string): UtilityGroup | null => {
	for (const [group, pattern] of Object.entries(UTILITY_GROUPS)) {
		if (pattern.test(utility)) return group as UtilityGroup
	}
	return null
}

// Only plain classes and single-breakpoint classes take part, hover: and the like stay untouched
const breakpointOf = (token: ClassToken): Breakpoint | null => {
	if (token.variants.length === 0) return ''
	if (
		token.variants.length === 1 &&
		BREAKPOINT_PREFIXES.has(token.variants[0])
	) {
		return token.variants[0] as Breakpoint
	}
	return null
}

const matches = (
	token: ClassToken,
	group: UtilityGroup,
	breakpoint: Breakpoint
) =>
	breakpointOf(token) === breakpoint &&
	UTILITY_GROUPS[group].test(token.utility)

// Utility set exactly at a breakpoint, like "p-4" for "md:p-4" at md
export const getUtility = (
	classes: string,
	group: UtilityGroup,
	breakpoint: Breakpoint
) =>
	splitClasses(classes)
		.map(parseClass)
		.findLast((token) => matches(token, group, breakpoint))?.utility ?? null

// Value in effect at a breakpoint and the breakpoint it comes from
export const resolveUtility = (
	classes: string,
	group: UtilityGroup,
	breakpoint: Breakpoint
) => {
	const order = BREAKPOINTS.map((b) => b.prefix)
	for (let i = order.indexOf(breakpoint); i >= 0; i--) {
		const utility = getUtility(classes, group, order[i])
		if (utility !== null) return { utility, from: order[i] as Breakpoint }
	}
	return null
}

const withPrefix = (breakpoint: Breakpoint, utility: string) =>
	breakpoint ? `${breakpoint}:${utility}` : utility

// Replaces the group's class at one breakpoint, null removes it
export const setUtility = (
	classes: string,
	group: UtilityGroup,
	breakpoint: Breakpoint,
	utility: string | null
) => {
	const tokens = splitClasses(classes)
	const at = tokens.findIndex((raw) =>
		matches(parseClass(raw), group, breakpoint)
	)
	const kept = tokens.filter(
		(raw) => !matches(parseClass(raw), group, breakpoint)
	)
	if (utility === null) return kept.join(' ')
	const next = withPrefix(breakpoint, utility)
	if (at < 0) return [...kept, next].join(' ')
	// The new class takes the place of the old one so diffs stay small
	kept.splice(Math.min(at, kept.length), 0, next)
	return kept.join(' ')
}

export const addClass = (classes: string, raw: string) => {
	const tokens = splitClasses(classes)
	return tokens.includes(raw) ? classes : [...tokens, raw].join(' ')
}

export const removeClass = (classes: string, raw: string) =>
	splitClasses(classes)
		.filter((token) => token !== raw)
		.join(' ')
