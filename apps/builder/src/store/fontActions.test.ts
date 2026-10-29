import { beforeEach, describe, expect, it } from 'vitest'
import type { FontChoice, Site } from '@ui-system/core'
import { useDocument } from '@/store/document'
import { sameChoice, setFont, weightsOf } from '@/store/fontActions'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'en',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: [],
}

const inter: FontChoice = {
	family: 'Inter',
	files: [
		{ weight: 700, style: 'normal', file: 'assets/fonts/a.woff2' },
		{ weight: 400, style: 'normal', file: 'assets/fonts/b.woff2' },
		{ weight: 400, style: 'italic', file: 'assets/fonts/c.woff2' },
	],
}

const fonts = () => useDocument.getState().doc?.site.fonts

beforeEach(() => {
	useDocument
		.getState()
		.load({ path: '/p', site, pages: [], partials: {} } as never)
})

describe('setFont', () => {
	it('sets and clears a role as single undo steps', () => {
		setFont('heading', inter)
		expect(fonts()?.heading).toEqual(inter)
		expect(fonts()?.body).toBeNull()
		setFont('heading', null)
		expect(fonts()?.heading).toBeNull()
		useDocument.getState().undo()
		expect(fonts()?.heading).toEqual(inter)
		useDocument.getState().undo()
		expect(fonts()?.heading).toBeNull()
	})

	it('does not record a step when nothing changes', () => {
		setFont('body', null)
		expect(useDocument.getState().past).toHaveLength(0)
	})
})

describe('helpers', () => {
	it('lists unique weights ascending', () => {
		expect(weightsOf(inter)).toEqual([400, 700])
	})

	it('compares choices by value', () => {
		expect(sameChoice(inter, structuredClone(inter))).toBe(true)
		expect(sameChoice(inter, null)).toBe(false)
	})
})
