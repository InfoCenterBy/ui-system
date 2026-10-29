import { applyPatches, enablePatches, produceWithPatches } from 'immer'
import { create } from 'zustand'
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
		const [next, patches, inverse] = produceWithPatches(doc, recipe)
		if (patches.length === 0) return
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
