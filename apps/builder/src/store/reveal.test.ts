import { beforeEach, describe, expect, it } from 'vitest'
import {
	parseSection,
	walk,
	type ElementNode,
	type Site,
} from '@ui-system/core'
import { setReveal } from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home'],
}

const section = parseSection({
	id: 'a',
	name: 'a',
	category: 'test',
	html: '<section><h2 class="t">Title</h2></section>',
})

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [
			{
				id: 'home',
				slug: 'index',
				name: 'home',
				meta: { title: 'h', description: '', ogImage: null },
				showHeader: true,
				showFooter: true,
				sections: [section],
			},
		],
		partials: { header: null, footer: null },
		components: [],
	})
})

const sections = () => useDocument.getState().doc!.pages.home.sections
const h2 = () => {
	let found: ElementNode | null = null
	walk(sections(), (n) => {
		if (n.type === 'element' && n.tag === 'h2') found = n
	})
	return found as unknown as ElementNode
}
const config = {
	type: 'zoom' as const,
	stagger: null,
	duration: 600,
	delay: 150,
	repeat: false,
}

describe('setReveal', () => {
	it('sets the section root even when it is locked, and undoes', () => {
		const root = sections()[0]
		expect(root.section?.locked).toBe(true)
		setReveal(root.id, config)
		expect(sections()[0].attrs).toMatchObject({
			'data-reveal': 'zoom',
			'data-reveal-delay': '150',
		})
		useDocument.getState().undo()
		expect(sections()[0].attrs['data-reveal']).toBeUndefined()
	})

	it('ignores inner elements of a locked section', () => {
		setReveal(h2().id, config)
		expect(h2().attrs['data-reveal']).toBeUndefined()
	})

	it('edits inner elements once the section is unlocked and clears them', () => {
		useDocument.getState().edit('unlock', (draft) => {
			draft.pages.home.sections[0].section!.locked = false
		})
		setReveal(h2().id, config)
		expect(h2().attrs['data-reveal']).toBe('zoom')
		setReveal(h2().id, { ...config, type: null })
		expect(h2().attrs).toEqual({})
	})
})
