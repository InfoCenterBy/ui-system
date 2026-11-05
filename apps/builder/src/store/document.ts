import {
	applyPatches,
	enablePatches,
	produceWithPatches,
	type Patch,
} from 'immer'
import { create } from 'zustand'
import { randomId, syncInstances, type ElementNode } from '@ui-system/core'
import type { Project } from '@/api'
import {
	dirtyKeys,
	pushEntry,
	type Doc,
	type HistoryEntry,
} from '@/store/history'

enablePatches()

export type SaveState = 'saved' | 'unsaved' | 'saving' | 'error'

interface DocumentState {
	doc: Doc | null
	past: HistoryEntry[]
	future: HistoryEntry[]
	// Files waiting for autosave
	dirty: Set<string>
	saveState: SaveState
	load: (project: Project) => void
	clear: () => void
	edit: (
		label: string,
		recipe: (draft: Doc) => void,
		options?: { mergeKey?: string }
	) => void
	undo: () => void
	redo: () => void
	takeDirty: () => Set<string>
	finishSave: (keys: Set<string>, ok: boolean) => void
}

// Rebuilds the instances of every component whose master changed. Runs on the
// state after the recipe, with the previous master to tell overrides apart
const syncPass = (before: Doc, after: Doc) => {
	const changed = Object.values(after.components).filter((c) => {
		const old = before.components[c.id]
		return (
			old &&
			(old.root !== c.root ||
				old.variants !== c.variants ||
				old.props !== c.props)
		)
	})
	if (changed.length === 0) return null
	return produceWithPatches(after, (draft) => {
		const lists: ElementNode[][] = [
			...Object.values(draft.pages).map((page) => page.sections),
			...(['header', 'footer'] as const).map((name) =>
				draft.partials[name] ? [draft.partials[name]] : []
			),
		]
		for (const component of changed) {
			syncInstances(
				lists,
				draft.components[component.id],
				before.components[component.id].root,
				randomId
			)
		}
	})
}

const union = (a: Set<string>, b: Set<string>) => new Set([...a, ...b])

export const useDocument = create<DocumentState>((set, get) => ({
	doc: null,
	past: [],
	future: [],
	dirty: new Set(),
	saveState: 'saved',

	load: (project) =>
		set({
			doc: {
				site: project.site,
				pages: Object.fromEntries(project.pages.map((p) => [p.id, p])),
				partials: project.partials,
				components: Object.fromEntries(
					project.components.map((c) => [c.id, c])
				),
			},
			past: [],
			future: [],
			dirty: new Set(),
			saveState: 'saved',
		}),

	clear: () =>
		set({
			doc: null,
			past: [],
			future: [],
			dirty: new Set(),
			saveState: 'saved',
		}),

	edit: (label, recipe, options = {}) => {
		const { doc, past, dirty } = get()
		if (!doc) return
		const [first, firstPatches, firstInverse] = produceWithPatches(
			doc,
			recipe
		)
		if (firstPatches.length === 0) return
		let next = first
		let patches: Patch[] = firstPatches
		let inverse: Patch[] = firstInverse
		// Master changes reach the instances inside the same undo step
		const sync = syncPass(doc, first)
		if (sync) {
			next = sync[0]
			patches = [...firstPatches, ...sync[1]]
			inverse = [...sync[2], ...firstInverse]
		}
		set({
			doc: next,
			past: pushEntry(past, {
				label,
				patches,
				inverse,
				mergeKey: options.mergeKey,
				at: Date.now(),
			}),
			future: [],
			dirty: union(dirty, dirtyKeys(patches)),
			saveState: 'unsaved',
		})
	},

	undo: () => {
		const { doc, past, future, dirty } = get()
		const entry = past.at(-1)
		if (!doc || !entry) return
		set({
			doc: applyPatches(doc, entry.inverse),
			past: past.slice(0, -1),
			future: [...future, entry],
			dirty: union(dirty, dirtyKeys(entry.inverse)),
			saveState: 'unsaved',
		})
	},

	redo: () => {
		const { doc, past, future, dirty } = get()
		const entry = future.at(-1)
		if (!doc || !entry) return
		set({
			doc: applyPatches(doc, entry.patches),
			// Redone steps never merge with the next edit
			past: [...past, { ...entry, mergeKey: undefined }],
			future: future.slice(0, -1),
			dirty: union(dirty, dirtyKeys(entry.patches)),
			saveState: 'unsaved',
		})
	},

	// Hands the dirty keys to the saver, edits made meanwhile collect anew
	takeDirty: () => {
		const keys = get().dirty
		set({ dirty: new Set(), saveState: 'saving' })
		return keys
	},

	finishSave: (keys, ok) => {
		const dirty = ok ? get().dirty : union(get().dirty, keys)
		const saveState = !ok ? 'error' : dirty.size ? 'unsaved' : 'saved'
		set({ dirty, saveState })
	},
}))
