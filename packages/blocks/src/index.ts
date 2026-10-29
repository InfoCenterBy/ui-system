/// <reference types="vite/client" />
import { categoryMeta } from './categories'
import type { Category, Group, Variant } from './categories'

export { categoryMeta }
export type {
	Category,
	CategoryMeta,
	Group,
	GroupId,
	Variant,
} from './categories'

const files = import.meta.glob<string>('./library/*/*.html', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const loadHtml = (slug: string, name: string): string => {
	const html = files[`./library/${slug}/${name}.html`]
	if (html === undefined)
		throw new Error(`Missing library/${slug}/${name}.html`)
	return html
}

const titleOf = (name: string) =>
	name[0].toUpperCase() + name.slice(1).replace(/-/g, ' ')

export const categories: Category[] = categoryMeta.map((meta) => {
	const variants: Variant[] = meta.variants.map((name) => ({
		name,
		title: titleOf(name),
		html: loadHtml(meta.slug, name),
	}))
	const showcase =
		variants.find((v) => v.name === meta.showcase) ?? variants[0]
	return { ...meta, variants, showcase }
})

// Group order follows daisyUI docs
export const groups: Group[] = [
	{ id: 'actions', name: 'Actions' },
	{ id: 'data-display', name: 'Data display' },
	{ id: 'navigation', name: 'Navigation' },
	{ id: 'feedback', name: 'Feedback' },
	{ id: 'data-input', name: 'Data input' },
	{ id: 'layout', name: 'Layout' },
	{ id: 'mockup', name: 'Mockup' },
]

export const getCategory = (slug: string): Category | undefined =>
	categories.find((c) => c.slug === slug)
