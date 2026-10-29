import type { Patch } from 'immer'
import type { Page, Partials, Site } from '@ui-system/core'

// Everything that is saved to the project folder
export interface Doc {
	site: Site
	pages: Record<string, Page>
	partials: Partials
}

export interface HistoryEntry {
	label: string
	patches: Patch[]
	inverse: Patch[]
	// Edits with the same key in a short time form one undo step, like typing
	mergeKey?: string
	at: number
}

export const HISTORY_LIMIT = 200
export const MERGE_WINDOW = 1500

// Files a set of patches touches: site, page:<id>, deleted:<id> or partial:<name>
export const dirtyKeys = (patches: Patch[]) => {
	const keys = new Set<string>()
	for (const { op, path } of patches) {
		const [root, id] = path
		if (root === 'site') keys.add('site')
		else if (root === 'partials' && typeof id === 'string') {
			keys.add(`partial:${id}`)
		} else if (root === 'pages' && typeof id === 'string') {
			// Removing a page entry deletes its file, adding one writes it
			keys.add(
				path.length === 2 && op === 'remove'
					? `deleted:${id}`
					: `page:${id}`
			)
		} else if (root === 'pages') {
			// The whole map was replaced
			keys.add('pages')
		}
	}
	return keys
}

export const pushEntry = (past: HistoryEntry[], entry: HistoryEntry) => {
	const last = past.at(-1)
	if (
		last &&
		entry.mergeKey &&
		last.mergeKey === entry.mergeKey &&
		entry.at - last.at < MERGE_WINDOW
	) {
		const merged: HistoryEntry = {
			...last,
			patches: [...last.patches, ...entry.patches],
			inverse: [...entry.inverse, ...last.inverse],
			at: entry.at,
		}
		return [...past.slice(0, -1), merged]
	}
	return [...past, entry].slice(-HISTORY_LIMIT)
}
