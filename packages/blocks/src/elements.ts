import { isElement, parseHtml, serializeHtml } from '@ui-system/core'
import type { ElementNode, TreeNode } from '@ui-system/core'
import { categories } from './catalog'
import type { GroupId } from './categories'

export interface ElementVariant {
	// `${slug}/${variant}`
	id: string
	name: string
	title: string
	// Builder-ready: one root element with data-label
	html: string
}

export interface ElementCategory {
	slug: string
	name: string
	group: GroupId
	variants: ElementVariant[]
}

// Children of `parent` matching `child` become items of a repeat group.
// Tokens match the tag or any class, `*` any element, `$wrapper` the generated
// wrapper, `a > b` a chain of direct ancestors.
interface RepeatRule {
	parent: string
	child: string
	// Defaults to the child token
	group?: string
	not?: string[]
}

interface Override {
	hidden?: boolean
	// Keep only the first root, no wrapper
	single?: boolean
	repeat?: RepeatRule[]
	// Skip the generic repeat rules
	defaultRepeat?: false
	// Classes of the wrapper when the markup has several roots
	wrap?: string
	// Hand-written builder HTML, replaces the library markup
	html?: string
	// Demo-only classes removed from every root
	strip?: string[]
	// Classes added to every root
	add?: string[]
	// Text edits of the library markup before parsing
	replace?: [RegExp, string][]
	// Attributes set on the root when there is a single one
	attrs?: Record<string, string>
}

const DEFAULT_WRAP = 'flex flex-wrap items-center gap-2'
const COLUMN = 'flex flex-col items-start gap-3'
const STACK = 'flex flex-col gap-2'
const ROW = 'flex flex-wrap items-start gap-4'

// Button opens the dialog through the command API, no inline handler
const MODAL_REPLACE: [RegExp, string][] = [
	[
		/onclick="\s*document\.getElementById\('([^']+)'\)\.showModal\(\)\s*"/g,
		'command="show-modal" commandfor="$1"',
	],
]

const COUNTDOWN_TO = '2026-12-31T00:00'
const COUNTDOWN_UNITS: Record<string, string> = {
	days: 'days',
	hours: 'hours',
	min: 'minutes',
	sec: 'seconds',
}

// Demo ids become unit markers, the demo script goes to the exported site.js
const countdownReplace = (
	units: Record<string, string>
): [RegExp, string][] => [
	[/\s*<script>[\s\S]*<\/script>/, ''],
	[/\s*aria-live="polite"/g, ''],
	...Object.entries(units).map(
		([id, unit]) =>
			[new RegExp(`id="${id}"`), `data-countdown="${unit}"`] as [
				RegExp,
				string,
			]
	),
]

// Apply to every element unless a category opts out
const DEFAULT_REPEAT: RepeatRule[] = [
	{ parent: 'menu', child: 'li', not: ['menu-title'] },
	{ parent: 'details > ul', child: 'li' },
	{ parent: 'join', child: 'btn' },
]

const PRIMARY_TAB: RepeatRule = { parent: 'tabs', child: 'tab' }

// Keyed by `slug` or `slug/variant`, a variant entry wins over its category
const overrides: Record<string, Override> = {
	// Pinned to the viewport or the page, not a part of a section
	dock: { hidden: true },
	drawer: { hidden: true },
	fab: { hidden: true },
	toast: { hidden: true },
	// Switches the theme of the whole page, needs the theme list and a script
	'theme-controller': { hidden: true },

	modal: { replace: MODAL_REPLACE },
	countdown: { attrs: { 'data-countdown-to': COUNTDOWN_TO } },
	'countdown/boxes': {
		replace: countdownReplace(
			Object.fromEntries(
				Object.entries(COUNTDOWN_UNITS).map(([k, v]) => [
					`countdown-${k}`,
					v,
				])
			)
		),
	},
	'countdown/default': {
		replace: countdownReplace({ 'countdown-default': 'seconds' }),
	},
	'countdown/clock': {
		replace: countdownReplace({
			'countdown-clock-h': 'hours',
			'countdown-clock-m': 'minutes',
			'countdown-clock-s': 'seconds',
		}),
	},
	'countdown/large': {
		replace: countdownReplace({ 'countdown-large': 'days' }),
	},
	'calendar/in-dropdown': {
		// The demo handler addresses the button by id
		replace: [
			[/\s*onchange="[^"]*"/, ''],
			[/\s*id="calendar-button"/, ''],
		],
	},
	dropdown: { wrap: ROW },
	'dropdown/positions': { single: true },
	megamenu: {
		wrap: STACK,
		repeat: [
			{ parent: 'grid', child: 'div' },
			{ parent: 'grid', child: 'menu' },
		],
	},
	'megamenu/sizes': { single: true },

	accordion: {
		wrap: STACK,
		repeat: [
			{ parent: '$wrapper', child: 'collapse' },
			{ parent: 'join', child: 'collapse' },
		],
	},
	alert: { wrap: STACK },
	aura: { wrap: 'flex flex-wrap items-center gap-6' },
	chat: { wrap: STACK, repeat: [{ parent: '$wrapper', child: 'chat' }] },
	card: { wrap: ROW, strip: ['w-80', 'w-56', 'w-64', 'w-72'] },
	carousel: { repeat: [{ parent: 'carousel', child: 'carousel-item' }] },
	// Slide ids and prev/next links point at each other
	'carousel/with-buttons': { repeat: [] },
	'carousel/full-width': {
		strip: ['w-80'],
		add: ['w-full'],
		repeat: [{ parent: 'carousel', child: 'carousel-item' }],
	},
	'hover-gallery': { repeat: [{ parent: 'hover-gallery', child: 'img' }] },
	'hover-gallery/in-card': {
		strip: ['w-60'],
		repeat: [{ parent: 'hover-gallery', child: 'img' }],
	},
	progress: { wrap: 'flex flex-col gap-4' },
	pagination: { wrap: 'flex flex-col items-center gap-4' },
	navbar: { wrap: STACK },
	menu: { wrap: ROW },
	tabs: {
		wrap: 'flex flex-col items-start gap-4',
		repeat: [PRIMARY_TAB],
	},
	// A tab is an input or label plus its separate panel
	'tabs/with-content': { repeat: [] },
	'tabs/with-icons': { repeat: [] },
	tooltip: { wrap: 'flex flex-wrap gap-x-6 gap-y-14 pt-12' },
	'radial-progress': { wrap: 'flex flex-wrap items-center gap-4' },
	rating: {
		wrap: 'flex flex-col items-start gap-3',
		repeat: [{ parent: 'rating', child: 'mask' }],
	},
	// Half stars come in pairs
	'rating/half': { repeat: [] },
	// Form controls
	'file-input': { wrap: COLUMN },
	input: { wrap: COLUMN },
	label: { wrap: COLUMN },
	otp: { wrap: COLUMN },
	range: { wrap: COLUMN },
	select: { wrap: COLUMN, repeat: [{ parent: 'select', child: 'option' }] },
	textarea: { wrap: COLUMN },
	// Shapes need room between them
	mask: { wrap: 'flex flex-wrap items-center gap-4' },
	avatar: {
		wrap: 'flex flex-wrap items-center gap-4',
		repeat: [{ parent: 'avatar-group', child: 'avatar' }],
	},
	// Text and markers sit in a line
	'status/animated': { wrap: 'flex flex-wrap items-center gap-x-3 gap-y-4' },

	// Repeat items
	steps: { repeat: [{ parent: 'steps', child: 'step' }] },
	timeline: { repeat: [{ parent: 'timeline', child: 'li' }] },
	breadcrumbs: { repeat: [{ parent: 'breadcrumbs > ul', child: 'li' }] },
	list: { repeat: [{ parent: 'list', child: 'list-row' }] },
	table: { repeat: [{ parent: 'tbody', child: 'tr' }] },
	stat: { repeat: [{ parent: 'stats', child: 'stat' }] },
	stack: { repeat: [{ parent: 'stack', child: '*' }] },
	'text-rotate': {
		repeat: [{ parent: 'text-rotate > span', child: 'span' }],
	},
	kbd: { repeat: [{ parent: '*', child: 'kbd' }] },
	filter: {
		repeat: [
			{
				parent: 'filter',
				child: 'btn',
				not: ['btn-square', 'filter-reset'],
			},
		],
	},
	footer: {
		repeat: [
			{ parent: 'footer', child: 'nav', group: 'column' },
			{ parent: 'nav', child: 'link' },
		],
	},
	'footer/centered': { repeat: [{ parent: 'nav', child: 'link' }] },
	// Forms and mixed controls keep their fixed parts
	fieldset: { defaultRepeat: false },
	'join/with-inputs': { defaultRepeat: false },

	// One card is one element, colors, sizes and positions go to the options
	...Object.fromEntries(
		[
			'button/colors',
			'button/sizes',
			'badge/colors',
			'badge/sizes',
			'alert/colors',
			'loading/colors',
			'loading/sizes',
			'tooltip/colors',
			'tooltip/positions',
			'status/colors',
			'status/sizes',
			'link/colors',
			'progress/colors',
			'kbd/sizes',
			'avatar/sizes',
			'checkbox/colors',
			'checkbox/sizes',
			'radio/colors',
			'radio/sizes',
			'toggle/colors',
			'toggle/sizes',
			'input/colors',
			'input/sizes',
			'select/colors',
			'select/sizes',
			'textarea/colors',
			'textarea/sizes',
			'file-input/colors',
			'file-input/sizes',
			'range/colors',
			'range/sizes',
			'divider/colors',
			'divider/positions',
			'menu/sizes',
			'tabs/sizes',
			'pagination/sizes',
			'otp/colors',
			'otp/sizes',
			'rating/sizes',
			'rating/colors',
			'card/sizes',
			'navbar/colors',
			'label/floating-sizes',
			'chat/colors',
			'radial-progress/colors',
		].map((id) => [id, { hidden: true }])
	),
	// Style, shape and type ranges keep their first instance
	...Object.fromEntries(
		[
			'button/soft',
			'button/outline',
			'button/dash',
			'button/ghost-and-link',
			'button/shapes',
			'badge/styles',
			'alert/soft',
			'alert/outline',
			'alert/dash',
			'aura/styles',
			'avatar/shapes',
			'avatar/placeholder',
			'progress/default',
			'radial-progress/values',
			'radial-progress/custom',
			'card/bordered',
			'card/no-image',
			'stack/directions',
			'input/types',
			'label/inside-input',
			'loading/types',
			'mask/shapes',
			'mask/stars-and-hearts',
		].map((id) => [id, { single: true }])
	),
}

const hiddenSlugs = new Set(
	Object.entries(overrides)
		.filter(([key, o]) => o.hidden && !key.includes('/'))
		.map(([key]) => key)
)

const classList = (classes: string) => classes.split(/\s+/).filter(Boolean)

const prepareRoot = (root: ElementNode, override: Override) => {
	const strip = new Set(override.strip)
	const classes = classList(root.classes).filter((c) => !strip.has(c))
	for (const c of override.add ?? [])
		if (!classes.includes(c)) classes.push(c)
	root.classes = classes.join(' ')
}

const tokenMatches = (el: ElementNode, token: string) =>
	token === '*' || el.tag === token || classList(el.classes).includes(token)

const parentMatches = (
	chain: string,
	ancestors: ElementNode[],
	wrapper?: ElementNode
) => {
	const tokens = chain.split('>').map((t) => t.trim())
	if (ancestors.length < tokens.length) return false
	return tokens.every((token, i) => {
		const el = ancestors[ancestors.length - tokens.length + i]
		return token === '$wrapper' ? el === wrapper : tokenMatches(el, token)
	})
}

const applyRepeat = (
	nodes: TreeNode[],
	rules: RepeatRule[],
	wrapper?: ElementNode,
	ancestors: ElementNode[] = []
) => {
	for (const node of nodes) {
		if (!isElement(node)) continue
		if (ancestors.length > 0 && !node.repeat) {
			const rule = rules.find(
				(r) =>
					tokenMatches(node, r.child) &&
					!r.not?.some((token) => tokenMatches(node, token)) &&
					parentMatches(r.parent, ancestors, wrapper)
			)
			if (rule) node.repeat = rule.group ?? rule.child
		}
		applyRepeat(node.children, rules, wrapper, [...ancestors, node])
	}
}

const build = (name: string, html: string, override: Override): string => {
	if (override.html !== undefined) return override.html
	let source = html
	for (const [pattern, text] of override.replace ?? [])
		source = source.replace(pattern, text)
	let roots = parseHtml(source).filter(
		(node) => isElement(node) || node.text.trim()
	)
	if (override.single) roots = roots.filter(isElement).slice(0, 1)
	for (const root of roots) if (isElement(root)) prepareRoot(root, override)
	let tree: TreeNode[] = roots
	let wrapper: ElementNode | undefined
	const single = roots.length === 1 ? roots[0] : undefined
	if (single && isElement(single)) {
		single.label = name
		Object.assign(single.attrs, override.attrs)
	} else {
		;[wrapper] = parseHtml(
			`<div class="${override.wrap ?? DEFAULT_WRAP}"></div>`
		) as ElementNode[]
		wrapper.label = name
		wrapper.children = roots
		tree = [wrapper]
	}
	const rules = [
		...(override.repeat ?? []),
		...(override.defaultRepeat === false ? [] : DEFAULT_REPEAT),
	]
	applyRepeat(tree, rules, wrapper)
	// Reparse so edge whitespace of the wrapper settles like in the builder
	return serializeHtml(parseHtml(serializeHtml(tree, { markers: true })), {
		markers: true,
	})
}

export const elementCategories: ElementCategory[] = categories
	.filter((category) => !hiddenSlugs.has(category.slug))
	.map((category) => {
		const base = overrides[category.slug] ?? {}
		const variants: ElementVariant[] = []
		for (const variant of category.variants) {
			const id = `${category.slug}/${variant.name}`
			const override = { ...base, ...overrides[id] }
			if (override.hidden) continue
			variants.push({
				id,
				name: variant.name,
				title: variant.title,
				html: build(category.name, variant.html, override),
			})
		}
		return {
			slug: category.slug,
			name: category.name,
			group: category.group,
			variants,
		}
	})
	.filter((category) => category.variants.length > 0)

export const getElementVariant = (id: string): ElementVariant | undefined => {
	for (const category of elementCategories) {
		const found = category.variants.find((v) => v.id === id)
		if (found) return found
	}
	return undefined
}
