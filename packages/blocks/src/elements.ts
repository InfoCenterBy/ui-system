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

interface Override {
	hidden?: boolean
	// Classes of the wrapper when the markup has several roots
	wrap?: string
	// Hand-written builder HTML, replaces the library markup
	html?: string
	// Demo-only classes removed from every root
	strip?: string[]
	// Classes added to every root
	add?: string[]
}

const DEFAULT_WRAP = 'flex flex-wrap items-center gap-2'
const COLUMN = 'flex flex-col items-start gap-3'
const STACK = 'flex flex-col gap-2'
const ROW = 'flex flex-wrap items-start gap-4'

// Keyed by `slug` or `slug/variant`, a variant entry wins over its category
const overrides: Record<string, Override> = {
	// Scripts or id coupling, a later stage
	calendar: { hidden: true },
	countdown: { hidden: true },
	dropdown: { hidden: true },
	megamenu: { hidden: true },
	modal: { hidden: true },
	// Pinned to the viewport or the page, not a part of a section
	dock: { hidden: true },
	drawer: { hidden: true },
	fab: { hidden: true },
	toast: { hidden: true },
	// Switches the theme of the whole page, needs the theme list and a script
	'theme-controller': { hidden: true },

	accordion: { wrap: STACK },
	alert: { wrap: STACK },
	aura: { wrap: 'flex flex-wrap items-center gap-6' },
	chat: { wrap: STACK },
	card: { wrap: ROW, strip: ['w-80', 'w-56', 'w-64', 'w-72'] },
	'carousel/full-width': { strip: ['w-80'], add: ['w-full'] },
	'hover-gallery/in-card': { strip: ['w-60'] },
	progress: { wrap: 'flex flex-col gap-4' },
	pagination: { wrap: 'flex flex-col items-center gap-4' },
	navbar: { wrap: STACK },
	menu: { wrap: ROW },
	tabs: { wrap: 'flex flex-col items-start gap-4' },
	tooltip: { wrap: 'flex flex-wrap gap-x-6 gap-y-14 pt-12' },
	'radial-progress': { wrap: 'flex flex-wrap items-center gap-4' },
	rating: { wrap: 'flex flex-col items-start gap-3' },
	// Form controls
	'file-input': { wrap: COLUMN },
	input: { wrap: COLUMN },
	label: { wrap: COLUMN },
	otp: { wrap: COLUMN },
	range: { wrap: COLUMN },
	select: { wrap: COLUMN },
	textarea: { wrap: COLUMN },
	// Shapes need room between them
	mask: { wrap: 'flex flex-wrap items-center gap-4' },
	avatar: { wrap: 'flex flex-wrap items-center gap-4' },
	// Text and markers sit in a line
	'status/animated': { wrap: 'flex flex-wrap items-center gap-x-3 gap-y-4' },
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

const build = (name: string, html: string, override: Override): string => {
	if (override.html !== undefined) return override.html
	const roots = parseHtml(html).filter(
		(node) => isElement(node) || node.text.trim()
	)
	for (const root of roots) if (isElement(root)) prepareRoot(root, override)
	let tree: TreeNode[] = roots
	const single = roots.length === 1 ? roots[0] : undefined
	if (single && isElement(single)) {
		single.label = name
	} else {
		const [wrapper] = parseHtml(
			`<div class="${override.wrap ?? DEFAULT_WRAP}"></div>`
		) as ElementNode[]
		wrapper.label = name
		wrapper.children = roots
		tree = [wrapper]
	}
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
