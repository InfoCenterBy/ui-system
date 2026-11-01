import type { SectionPreset } from '@ui-system/core'
import type { SectionCategory } from '@ui-system/blocks/sections'
import { categoryName, sectionName } from '@/i18n/names'

export type SectionGroup = {
	category: SectionCategory
	presets: SectionPreset[]
}

// Groups presets by category, keeps only the ones matching the query
export function groupSections(
	categories: SectionCategory[],
	presets: SectionPreset[],
	query: string
): SectionGroup[] {
	const q = query.trim().toLowerCase()
	return categories
		.map((category) => ({
			category,
			presets: presets.filter(
				(p) =>
					p.category === category.id &&
					(!q ||
						p.name.toLowerCase().includes(q) ||
						sectionName(p.name).toLowerCase().includes(q) ||
						category.name.toLowerCase().includes(q) ||
						categoryName(category).toLowerCase().includes(q))
			),
		}))
		.filter((g) => g.presets.length > 0)
}

// Open category ids from a stored JSON string, bad data gives an empty list
export function parseOpenIds(raw: string | null): string[] {
	if (!raw) return []
	try {
		const data: unknown = JSON.parse(raw)
		if (!Array.isArray(data)) return []
		return data.filter((x): x is string => typeof x === 'string')
	} catch {
		return []
	}
}
