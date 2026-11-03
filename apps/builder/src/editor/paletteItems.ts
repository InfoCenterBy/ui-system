export type PaletteGroup = 'page' | 'section' | 'element' | 'action'

export interface PaletteItem {
	id: string
	group: PaletteGroup
	label: string
	// Secondary text, searched too
	hint?: string
	run: () => void
}

const ORDER: PaletteGroup[] = ['action', 'page', 'section', 'element']

// Every word of the query must appear in the label or hint. Each group is
// capped so a short query does not list the whole library
export const filterItems = (
	items: PaletteItem[],
	query: string,
	cap = 8
): PaletteItem[] => {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean)
	const limit = words.length ? cap * 2 : cap
	const matches = items.filter((item) => {
		const text = `${item.label} ${item.hint ?? ''}`.toLowerCase()
		return words.every((word) => text.includes(word))
	})
	return ORDER.flatMap((group) =>
		matches.filter((item) => item.group === group).slice(0, limit)
	)
}
