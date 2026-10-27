import { categoryMeta } from './categories'

const files = import.meta.glob('../library/*/*.html', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const loadHtml = (slug, name) => {
	const html = files[`../library/${slug}/${name}.html`]
	if (html === undefined)
		throw new Error(`Missing library/${slug}/${name}.html`)
	return html
}

const titleOf = (name) =>
	name[0].toUpperCase() + name.slice(1).replace(/-/g, ' ')

export const categories = categoryMeta.map((meta) => {
	const variants = meta.variants.map((name) => ({
		name,
		title: titleOf(name),
		html: loadHtml(meta.slug, name),
	}))
	const showcase =
		variants.find((v) => v.name === meta.showcase) ?? variants[0]
	return { ...meta, variants, showcase }
})

// Group order follows daisyUI docs
export const groups = [
	{ id: 'actions', name: 'Actions' },
	{ id: 'data-display', name: 'Data display' },
	{ id: 'navigation', name: 'Navigation' },
	{ id: 'feedback', name: 'Feedback' },
	{ id: 'data-input', name: 'Data input' },
	{ id: 'layout', name: 'Layout' },
	{ id: 'mockup', name: 'Mockup' },
]

export const pages = [
	{ path: '/', name: 'All components' },
	{ path: '/theme-generator', name: 'Theme generator' },
	{ path: '/colors', name: 'Colors' },
]

export const categoryPath = (slug) => `/components/${slug}`

export const getCategory = (slug) => categories.find((c) => c.slug === slug)

// Non-empty groups with categories sorted by name
export const groupedCategories = groups
	.map((group) => ({
		...group,
		categories: categories
			.filter((c) => c.group === group.id)
			.sort((a, b) => a.name.localeCompare(b.name)),
	}))
	.filter((group) => group.categories.length > 0)
