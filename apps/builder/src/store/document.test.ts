import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Page, Site } from '@ui-system/core'
import { saveKeys } from '@/store/autosave'
import { useDocument } from '@/store/document'
import { dirtyKeys } from '@/store/history'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home'],
}

const page = (id: string): Page => ({
	id,
	slug: id === 'home' ? 'index' : id,
	name: id,
	meta: { title: id, description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections: [],
})

beforeEach(() => {
	useDocument.getState().load({
		path: '/p',
		site,
		pages: [page('home')],
		partials: { header: null, footer: null },
	})
})

const doc = () => useDocument.getState().doc!

describe('document store', () => {
	it('undoes and redoes edits', () => {
		const { edit, undo, redo } = useDocument.getState()
		edit('Rename', (d) => {
			d.site.name = 'New'
		})
		expect(doc().site.name).toBe('New')
		undo()
		expect(doc().site.name).toBe('Test')
		redo()
		expect(doc().site.name).toBe('New')
		expect(useDocument.getState().future).toHaveLength(0)
	})

	it('merges quick edits with the same key into one step', () => {
		const { edit } = useDocument.getState()
		for (const name of ['A', 'AB', 'ABC']) {
			edit('Type', (d) => void (d.site.name = name), { mergeKey: 'name' })
		}
		expect(useDocument.getState().past).toHaveLength(1)
		useDocument.getState().undo()
		expect(doc().site.name).toBe('Test')
	})

	it('drops redo steps after a new edit and skips empty edits', () => {
		const { edit, undo } = useDocument.getState()
		edit('a', (d) => void (d.site.lang = 'en'))
		undo()
		edit('b', (d) => void (d.site.name = 'B'))
		expect(useDocument.getState().future).toHaveLength(0)
		edit('noop', () => {})
		expect(useDocument.getState().past).toHaveLength(1)
	})

	it('tracks which files need saving', () => {
		useDocument.getState().edit('Add page', (d) => {
			d.pages.about = page('about')
			d.site.pages.push('about')
		})
		expect([...useDocument.getState().dirty].sort()).toEqual([
			'page:about',
			'site',
		])
		const keys = useDocument.getState().takeDirty()
		expect(useDocument.getState().saveState).toBe('saving')
		useDocument.getState().finishSave(keys, true)
		expect(useDocument.getState().saveState).toBe('saved')
	})

	it('keeps keys dirty when saving fails', () => {
		useDocument.getState().edit('x', (d) => void (d.site.name = 'X'))
		const keys = useDocument.getState().takeDirty()
		useDocument.getState().finishSave(keys, false)
		expect(useDocument.getState().saveState).toBe('error')
		expect(useDocument.getState().dirty.has('site')).toBe(true)
	})
})

describe('dirtyKeys', () => {
	it('maps patch paths to files', () => {
		expect([
			...dirtyKeys([
				{ op: 'replace', path: ['pages', 'home', 'name'], value: 'x' },
				{ op: 'remove', path: ['pages', 'old'] },
				{ op: 'replace', path: ['partials', 'header'], value: null },
			]),
		]).toEqual(['page:home', 'deleted:old', 'partial:header'])
	})
})

describe('saveKeys', () => {
	it('writes pages before the site and deletes last', async () => {
		const calls: string[] = []
		const client = {
			saveSite: vi.fn(async () => void calls.push('site')),
			savePage: vi.fn(async (p: Page) => void calls.push(`page ${p.id}`)),
			deletePage: vi.fn(
				async (id: string) => void calls.push(`delete ${id}`)
			),
			savePartial: vi.fn(
				async (name: string) => void calls.push(`partial ${name}`)
			),
		} as never
		await saveKeys(
			doc(),
			new Set(['site', 'page:home', 'deleted:old', 'partial:footer']),
			client
		)
		expect(calls).toEqual([
			'page home',
			'partial footer',
			'site',
			'delete old',
		])
	})
})
