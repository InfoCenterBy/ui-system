import type { GroupId } from '@ui-system/blocks'
import type { ElementCategory } from '@ui-system/blocks'
import { LAYOUT_COMPONENTS, type LayoutVariant } from '@/editor/layoutPresets'

export interface ElementEntry {
	slug: string
	name: string
	variants: LayoutVariant[]
}

export interface ElementGroup {
	id: string
	name: string
	entries: ElementEntry[]
}

export const BUILDER_GROUP = 'builder-layout'

interface GroupInfo {
	id: GroupId
	name: string
}

// Builder layout first, then the library groups in order. With a query only
// matching components stay: a component name keeps all its variants, a variant
// title keeps just the matching ones
export function groupElements(
	groups: GroupInfo[],
	categories: ElementCategory[],
	query: string
): ElementGroup[] {
	const q = query.trim().toLowerCase()
	const filter = (entries: ElementEntry[]) =>
		entries.flatMap((entry) => {
			if (!q || entry.name.toLowerCase().includes(q)) return [entry]
			const variants = entry.variants.filter((v) =>
				v.title.toLowerCase().includes(q)
			)
			return variants.length > 0 ? [{ ...entry, variants }] : []
		})
	const all: ElementGroup[] = [
		{ id: BUILDER_GROUP, name: 'Structure', entries: LAYOUT_COMPONENTS },
		...groups.map((group) => ({
			id: group.id as string,
			name: group.name,
			entries: categories
				.filter((c) => c.group === group.id)
				.map((c) => ({
					slug: c.slug,
					name: c.name,
					variants: c.variants.map((v) => ({
						id: v.id,
						title: v.title,
						html: v.html,
					})),
				})),
		})),
	]
	return all
		.map((g) => ({ ...g, entries: filter(g.entries) }))
		.filter((g) => g.entries.length > 0)
}
