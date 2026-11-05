import { beforeEach, describe, expect, it } from 'vitest'
import {
	findElement,
	type ElementNode,
	type Page,
	type Site,
} from '@ui-system/core'
import {
	isValidPopupId,
	popupIdTaken,
	retargetTriggers,
} from '@/editor/properties/popups'
import { renamePopupId, setImageAlt } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const el = (
	id: string,
	tag: string,
	attrs: Record<string, string> = {},
	children: ElementNode[] = [],
	classes = ''
): ElementNode => ({
	id,
	type: 'element',
	tag,
	classes,
	attrs,
	children,
})

const section = (id: string, children: ElementNode[]): ElementNode => ({
	...el(id, 'section', {}, children),
	section: { preset: 'custom', locked: false },
})

const shared = (node: ElementNode): ElementNode => ({
	...node,
	section: { preset: 'header-simple', locked: false },
})

const modal = (id: string, attrs: Record<string, string>) =>
	el(id, 'dialog', attrs, [], 'modal')

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'en',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home', 'about'],
}

const page = (id: string, sections: ElementNode[]): Page => ({
	id,
	slug: id,
	name: id,
	meta: { title: id, description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections,
})

const doc = () => useDocument.getState().doc!
const attrsOf = (id: string, list = doc().pages.home.sections) =>
	findElement(list, id)!.attrs

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [
			page('home', [
				section('s1', [
					modal('m1', { id: 'modal-a' }),
					el('link', 'a', { href: '#modal-a' }),
					el('btn', 'button', {
						command: 'show-modal',
						commandfor: 'modal-a',
					}),
					el('other', 'a', { href: '#modal-b' }),
				]),
			]),
			page('about', [
				section('s2', [el('t2', 'a', { href: '#modal-a' })]),
			]),
		],
		partials: {
			header: shared(
				el('hd', 'header', {}, [
					el('hlink', 'a', { href: '#modal-a' }),
					modal('hm', { id: 'modal-h' }),
				])
			),
			footer: shared(
				el('ft', 'footer', {}, [
					el('fbtn', 'button', { popovertarget: 'modal-a' }),
					el('flink', 'a', { href: '#modal-h' }),
				])
			),
		},
		components: [],
	})
	useProject.getState().setCurrentPage('home')
})

describe('popup id helpers', () => {
	it('checks the id shape and uniqueness', () => {
		expect(isValidPopupId('modal-1')).toBe(true)
		expect(isValidPopupId('1x')).toBe(false)
		expect(isValidPopupId('a b')).toBe(false)
		const roots = [el('a', 'div', { id: 'x' }), el('b', 'div', { id: 'y' })]
		expect(popupIdTaken(roots, 'x', 'b')).toBe(true)
		expect(popupIdTaken(roots, 'x', 'a')).toBe(false)
	})
	it('retargets links, commands and popover buttons', () => {
		const roots = [
			el('l', 'a', { href: '#old' }),
			el('c', 'button', { commandfor: 'old' }),
			el('p', 'button', { popovertarget: 'old' }),
			el('k', 'a', { href: '#older' }),
		]
		retargetTriggers(roots, 'old', 'new')
		expect(roots.map((n) => n.attrs)).toEqual([
			{ href: '#new' },
			{ commandfor: 'new' },
			{ popovertarget: 'new' },
			{ href: '#older' },
		])
	})
})

describe('renamePopupId', () => {
	it('updates triggers on the page and in the shared parts in one undo step', () => {
		renamePopupId('m1', 'modal-contact')
		expect(attrsOf('m1').id).toBe('modal-contact')
		expect(attrsOf('link').href).toBe('#modal-contact')
		expect(attrsOf('btn').commandfor).toBe('modal-contact')
		expect(attrsOf('other').href).toBe('#modal-b')
		const { header, footer } = doc().partials
		expect(findElement([header!], 'hlink')!.attrs.href).toBe(
			'#modal-contact'
		)
		expect(findElement([footer!], 'fbtn')!.attrs.popovertarget).toBe(
			'modal-contact'
		)
		// Another page does not see this popup
		expect(attrsOf('t2', doc().pages.about.sections).href).toBe('#modal-a')
		useDocument.getState().undo()
		expect(attrsOf('m1').id).toBe('modal-a')
		expect(attrsOf('link').href).toBe('#modal-a')
		expect(findElement([doc().partials.header!], 'hlink')!.attrs.href).toBe(
			'#modal-a'
		)
	})
	it('updates every page when the popup lives in the header', () => {
		renamePopupId('hm', 'menu-modal')
		expect(findElement([doc().partials.footer!], 'flink')!.attrs.href).toBe(
			'#menu-modal'
		)
	})
	it('ignores a taken or invalid id', () => {
		renamePopupId('m1', 'modal-h')
		renamePopupId('m1', 'bad id')
		expect(attrsOf('m1').id).toBe('modal-a')
		expect(attrsOf('link').href).toBe('#modal-a')
	})
})

describe('setImageAlt', () => {
	it('marks an image decorative and back', () => {
		setImageAlt('m1', '', true)
		expect(attrsOf('m1')).toMatchObject({ alt: '', role: 'presentation' })
		setImageAlt('m1', 'A cat')
		expect(attrsOf('m1').alt).toBe('A cat')
		expect(attrsOf('m1').role).toBeUndefined()
	})
})
