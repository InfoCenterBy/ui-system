import { classToken } from '@ui-system/theme'

export interface SuggestSource {
	utilities: readonly string[]
	components: readonly string[]
	variants: readonly string[]
}

export interface Suggestion {
	// Full text to put in the field
	value: string
	// Class or variant name without the typed prefix
	name: string
	kind: 'component' | 'utility' | 'variant'
}

const KIND_RANK = { component: 0, utility: 1, variant: 2 } as const

// Lower is better: prefix match, then segments matching in order, then substring
export const matchScore = (query: string, name: string): number | null => {
	if (name.startsWith(query)) return 0
	const parts = query.split('-')
	const words = name.split('-')
	let at = 0
	let skipped = 0
	for (const part of parts) {
		while (at < words.length && !words[at].startsWith(part)) {
			at++
			skipped++
		}
		if (at >= words.length) {
			return name.includes(query) ? 100 : null
		}
		at++
	}
	return 1 + skipped
}

// Suggestions for the text typed so far, the variant prefix stays in front
export const suggest = (
	typed: string,
	source: SuggestSource,
	limit = 40
): Suggestion[] => {
	const { prefix, base } = classToken(typed)
	if (!base) return []
	const found: { item: Suggestion; score: number }[] = []
	const scan = (names: readonly string[], kind: Suggestion['kind']) => {
		for (const name of names) {
			const score = matchScore(base, name)
			if (score === null) continue
			const label = kind === 'variant' ? `${name}:` : name
			found.push({
				item: { value: `${prefix}${label}`, name: label, kind },
				score,
			})
		}
	}
	scan(source.components, 'component')
	scan(source.utilities, 'utility')
	scan(source.variants, 'variant')
	return found
		.sort(
			(a, b) =>
				a.score - b.score ||
				KIND_RANK[a.item.kind] - KIND_RANK[b.item.kind] ||
				a.item.name.length - b.item.name.length ||
				a.item.name.localeCompare(b.item.name, 'en', { numeric: true })
		)
		.slice(0, limit)
		.map((entry) => entry.item)
}
