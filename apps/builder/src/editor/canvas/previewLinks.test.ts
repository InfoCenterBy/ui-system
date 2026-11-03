import { describe, expect, it } from 'vitest'
import { previewLinkTarget } from './previewLinks'

const pages = [
	{ id: 'p1', slug: 'index' },
	{ id: 'p2', slug: 'about' },
]

describe('previewLinkTarget', () => {
	it('switches to a page by file name', () => {
		expect(previewLinkTarget('about.html', pages)).toEqual({
			kind: 'page',
			id: 'p2',
		})
		expect(previewLinkTarget('./about.html#team', pages)).toEqual({
			kind: 'page',
			id: 'p2',
		})
		expect(previewLinkTarget('/', pages)).toEqual({
			kind: 'page',
			id: 'p1',
		})
	})

	it('leaves anchors and mail links alone', () => {
		expect(previewLinkTarget('#pricing', pages).kind).toBe('native')
		expect(previewLinkTarget('mailto:a@b.c', pages).kind).toBe('native')
	})

	it('opens other sites in a tab and blocks unknown files', () => {
		expect(previewLinkTarget('https://example.com', pages).kind).toBe(
			'external'
		)
		expect(previewLinkTarget('missing.html', pages).kind).toBe('blocked')
	})
})
