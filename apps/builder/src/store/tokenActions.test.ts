import { beforeEach, describe, expect, it } from 'vitest'
import type { ElementNode, Page, Site } from '@ui-system/core'
import { useDocument } from '@/store/document'
import {
	addToken,
	deleteToken,
	renameToken,
	setTokenValue,
	tokenUsage,
} from '@/store/tokenActions'

const el = (id: string, classes: string, children: ElementNode[] = []) =>
	({
		id,
		type: 'element',
		tag: 'div',
		classes,
		attrs: {},
		children,
	}) as ElementNode

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'en',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['index'],
	tokens: [
		{ name: 'brand', type: 'color', value: '#f00' },
		{ name: 'section', type: 'spacing', value: '6rem' },
	],
}

const page = {
	id: 'index',
	name: 'Home',
	slug: 'index',
	sections: [
		el('s1', 'py-section', [el('a', 'md:hover:bg-brand/50 text-brand')]),
	],
} as unknown as Page

const doc = () => useDocument.getState().doc!

beforeEach(() => {
	useDocument.getState().load({
		path: '/p',
		site,
		pages: [page],
		partials: { header: el('h', 'bg-brand p-4'), footer: null },
		components: [
			{ id: 'card', name: 'Card', root: el('c', 'border-brand') },
		],
	} as never)
})

describe('token actions', () => {
	it('adds, edits and deletes tokens with undo', () => {
		expect(
			addToken({ name: 'card', type: 'radius', value: '1rem' })
		).toBeNull()
		expect(doc().site.tokens).toHaveLength(3)
		setTokenValue('card', '2rem')
		expect(doc().site.tokens?.[2].value).toBe('2rem')
		deleteToken('card')
		expect(doc().site.tokens).toHaveLength(2)
		useDocument.getState().undo()
		expect(doc().site.tokens).toHaveLength(3)
	})

	it('refuses bad or clashing names', () => {
		expect(
			addToken({ name: 'primary', type: 'color', value: '#fff' })
		).toBe('reserved')
		expect(addToken({ name: 'brand', type: 'color', value: '#fff' })).toBe(
			'duplicate'
		)
		expect(addToken({ name: 'x', type: 'color', value: 'nope' })).toBe(
			'value'
		)
		expect(doc().site.tokens).toHaveLength(2)
	})

	it('lists where a token is used', () => {
		const usage = tokenUsage(doc(), site.tokens![0])
		expect(usage.pages).toEqual([{ id: 'index', name: 'Home', count: 1 }])
		expect(usage.partials).toEqual(['header'])
		expect(usage.components).toEqual([{ id: 'card', name: 'Card' }])
		expect(usage.total).toBe(3)
	})

	it('renames in pages, partials and components as one undo step', () => {
		expect(renameToken('brand', 'main')).toBeNull()
		const a = doc().pages.index.sections[0].children[0] as ElementNode
		expect(a.classes).toBe('md:hover:bg-main/50 text-main')
		expect(doc().partials.header?.classes).toBe('bg-main p-4')
		expect(doc().components.card.root.classes).toBe('border-main')
		expect(doc().site.tokens?.[0].name).toBe('main')
		expect(useDocument.getState().past).toHaveLength(1)
		useDocument.getState().undo()
		expect(doc().partials.header?.classes).toBe('bg-brand p-4')
		expect(doc().site.tokens?.[0].name).toBe('brand')
	})

	it('does not rename onto an existing name', () => {
		expect(renameToken('brand', 'section')).toBe('duplicate')
		expect(renameToken('brand', 'sm')).toBe('reserved')
		expect(doc().site.tokens?.[0].name).toBe('brand')
	})
})
