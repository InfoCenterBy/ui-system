import { groups, categories } from '@ui-system/blocks'

export * from '@ui-system/blocks'

export const pages = [
	{ path: '/', name: 'All components' },
	{ path: '/favorites', name: 'Favorites' },
	{ path: '/theme-generator', name: 'Theme generator' },
	{ path: '/colors', name: 'Colors' },
]

export const categoryPath = (slug) => `/components/${slug}`

// Non-empty groups with categories sorted by name
export const groupedCategories = groups
	.map((group) => ({
		...group,
		categories: categories
			.filter((c) => c.group === group.id)
			.sort((a, b) => a.name.localeCompare(b.name)),
	}))
	.filter((group) => group.categories.length > 0)
