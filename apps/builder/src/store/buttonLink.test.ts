import { beforeEach, describe, expect, it, vi } from 'vitest'
import { walk, type ElementNode, type Page, type Site } from '@ui-system/core'
import { addCustomBlock, convertToLink } from '@/store/actions'
import { canBecomeLink } from '@/editor/properties/linkable'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

vi.mock('@/api', () => ({
	api: { placeholder: () => Promise.reject(new Error('none')) },
}))

const page: Page = {
	id: 'home',
	slug: 'index',
	name: 'Home',
	meta: { title: 'Home', description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections: [],
}

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'en',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home'],
}

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [page],
		partials: { header: null, footer: null },
		components: [],
	})
})

const elements = () => {
	const found: ElementNode[] = []
	walk(useDocument.getState().doc!.pages.home.sections, (n) => {
		if (n.type === 'element' && n.tag !== 'section' && !n.label)
			found.push(n)
	})
	return found
}

describe('convertToLink', () => {
	it('turns a plain button into an anchor in one undo step', async () => {
		await addCustomBlock(
			undefined,
			'<button class="btn btn-primary" type="button">Go</button>'
		)
		const [button] = elements().filter((n) => n.tag === 'button')
		convertToLink(button.id)
		const link = elements().find((n) => n.id === button.id)!
		expect(link.tag).toBe('a')
		expect(link.classes).toBe('btn btn-primary')
		expect(link.attrs).toEqual({ href: '#' })
		expect(link.children).toHaveLength(1)
		useDocument.getState().undo()
		expect(elements().find((n) => n.id === button.id)!.tag).toBe('button')
	})

	it('leaves submit and popover or dialog triggers alone', async () => {
		await addCustomBlock(
			undefined,
			'<div><button class="btn" type="submit">S</button>' +
				'<button class="btn" command="show-modal" commandfor="m">M</button>' +
				'<button class="btn" popovertarget="p">P</button></div>'
		)
		const buttons = elements().filter((n) => n.tag === 'button')
		expect(buttons).toHaveLength(3)
		for (const button of buttons) {
			expect(canBecomeLink(button)).toBe(false)
			convertToLink(button.id)
		}
		expect(elements().filter((n) => n.tag === 'button')).toHaveLength(3)
	})
})
