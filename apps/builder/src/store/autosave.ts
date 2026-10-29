import { api } from '@/api'
import { useDocument } from '@/store/document'
import type { Doc } from '@/store/history'

type Client = Pick<
	typeof api,
	'saveSite' | 'savePage' | 'deletePage' | 'savePartial'
>

// Page files go first and deletions last, so site.json never lists a missing page
export const saveKeys = async (
	doc: Doc,
	keys: Set<string>,
	client: Client = api
) => {
	const pageIds = new Set<string>()
	const deleted: string[] = []
	for (const key of keys) {
		const [kind, id] = key.split(':')
		if (kind === 'page') pageIds.add(id)
		if (kind === 'deleted') deleted.push(id)
		if (kind === 'pages')
			Object.keys(doc.pages).forEach((pid) => pageIds.add(pid))
	}
	for (const id of pageIds) {
		const page = doc.pages[id]
		if (page) await client.savePage(page)
	}
	for (const name of ['header', 'footer'] as const) {
		if (keys.has(`partial:${name}`))
			await client.savePartial(name, doc.partials[name])
	}
	if (keys.has('site') || deleted.length) await client.saveSite(doc.site)
	for (const id of deleted) {
		if (!doc.pages[id]) await client.deletePage(id)
	}
}

// Saves a short moment after the last edit, returns a stop function
export const startAutosave = (delay = 700) => {
	let timer: ReturnType<typeof setTimeout> | undefined
	let running = false

	const run = async () => {
		const state = useDocument.getState()
		if (running || !state.doc || state.dirty.size === 0) return
		running = true
		const doc = state.doc
		const keys = state.takeDirty()
		try {
			await saveKeys(doc, keys)
			useDocument.getState().finishSave(keys, true)
		} catch (error) {
			console.error(error)
			useDocument.getState().finishSave(keys, false)
		} finally {
			running = false
			// Edits made while saving get their own round
			if (useDocument.getState().dirty.size) schedule()
		}
	}

	const schedule = () => {
		clearTimeout(timer)
		timer = setTimeout(() => void run(), delay)
	}

	const unsubscribe = useDocument.subscribe((state, prev) => {
		if (state.dirty !== prev.dirty && state.dirty.size) schedule()
	})

	const warn = (event: BeforeUnloadEvent) => {
		if (useDocument.getState().saveState !== 'saved') event.preventDefault()
	}
	window.addEventListener('beforeunload', warn)

	return () => {
		clearTimeout(timer)
		unsubscribe()
		window.removeEventListener('beforeunload', warn)
	}
}
