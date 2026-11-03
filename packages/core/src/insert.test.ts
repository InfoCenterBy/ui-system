import { describe, expect, it } from 'vitest'
import { counterIds } from './ids'
import { parseHtml, serializeHtml } from './html'
import { prepareInsert, replaceDemoImages } from './insert'
import type { ElementNode } from './types'

const prepare = (html: string, token = 't', imageSrc?: string) =>
	serializeHtml(
		prepareInsert(parseHtml(html, counterIds()), {
			newId: () => token,
			imageSrc,
		})
	)

describe('prepareInsert', () => {
	it('renames ids and follows label for, href and aria references', () => {
		const out = prepare(
			'<div><input id="a" /><label for="a">A</label><a href="#a">go</a>' +
				'<button aria-controls="a b" aria-labelledby="a" popovertarget="a">x</button>' +
				'<div id="b"></div><a href="#other">y</a><a href="/a">z</a></div>'
		)
		expect(out).toContain('id="a-t"')
		expect(out).toContain('for="a-t"')
		expect(out).toContain('href="#a-t"')
		expect(out).toContain('aria-controls="a-t b-t"')
		expect(out).toContain('aria-labelledby="a-t"')
		expect(out).toContain('popovertarget="a-t"')
		expect(out).toContain('id="b-t"')
		expect(out).toContain('href="#other"')
		expect(out).toContain('href="/a"')
	})

	it('keeps radios of one group together under a new name', () => {
		const html =
			'<div><input type="radio" name="acc" /><input type="radio" name="acc" />' +
			'<input type="checkbox" name="c" /><input type="text" name="acc" /></div>'
		const root = prepareInsert(parseHtml(html, counterIds()), {
			newId: () => 'x',
		})[0] as ElementNode
		const names = root.children.map((c) => (c as ElementNode).attrs.name)
		expect(names).toEqual(['acc-x', 'acc-x', 'c-x', 'acc'])
	})

	it('gives two inserts of the same tabs different radio names', () => {
		const html =
			'<div role="tablist"><input type="radio" name="tabs" class="tab" aria-label="One" />' +
			'<input type="radio" name="tabs" class="tab" aria-label="Two" /></div>'
		const nodes = parseHtml(html, counterIds())
		let n = 0
		const newId = () => `k${++n}`
		const a = serializeHtml(prepareInsert(nodes, { newId }))
		const b = serializeHtml(prepareInsert(nodes, { newId }))
		expect(a).toContain('name="tabs-k1"')
		expect(b).toContain('name="tabs-k2"')
		expect(a).not.toBe(b)
	})

	it('swaps demo images only when a replacement is given', () => {
		const html =
			'<img src="https://img.daisyui.com/a.webp" srcset="x 2x" alt="A" />' +
			'<img src="assets/mine.png" />' +
			'<picture><source srcset="https://img.daisyui.com/b.webp" /></picture>'
		expect(prepare(html)).toContain('https://img.daisyui.com/a.webp')
		const out = prepare(html, 't', 'assets/placeholder.svg')
		expect(out).toContain('<img src="assets/placeholder.svg" alt="A">')
		expect(out).toContain('src="assets/mine.png"')
		expect(out).toContain('<source srcset="assets/placeholder.svg">')
		expect(out).not.toContain('daisyui')
	})

	it('renames commandfor and inline anchor names consistently', () => {
		const out = prepare(
			'<div><button commandfor="m" command="show-modal" style="anchor-name: --a">x</button>' +
				'<dialog id="m" style="position-anchor: --a; top: anchor(--a bottom); left: anchor-size(--a width)"></dialog>' +
				'<p style="anchor-name: --keep, --a">y</p><i style="position-anchor: --other"></i></div>'
		)
		expect(out).toContain('commandfor="m-t"')
		expect(out).toContain('id="m-t"')
		expect(out).toContain('anchor-name: --a-t"')
		expect(out).toContain(
			'position-anchor: --a-t; top: anchor(--a-t bottom); left: anchor-size(--a-t width)'
		)
		expect(out).toContain('anchor-name: --keep-t, --a-t')
		expect(out).toContain('position-anchor: --other')
	})

	it('swaps demo background images in inline styles', () => {
		const html =
			'<div style="background-image: url(https://img.daisyui.com/x.webp); color: red"></div>'
		expect(prepare(html, 't', 'assets/p.svg')).toContain(
			'style="background-image: url(assets/p.svg); color: red"'
		)
	})

	it('does not change node ids and does not mutate the input', () => {
		const nodes = parseHtml('<p id="a" class="x">t</p>', counterIds())
		const out = prepareInsert(nodes, { newId: () => 't' })
		expect(out[0].id).toBe(nodes[0].id)
		expect((nodes[0] as ElementNode).attrs.id).toBe('a')
		expect(out[0]).not.toBe(nodes[0])
	})
})

describe('replaceDemoImages', () => {
	it('swaps demo photos in place and keeps other sources and ids', () => {
		const nodes = parseHtml(
			'<section id="s"><img src="https://img.daisyui.com/a.webp" srcset="x 2x" />' +
				'<img src="assets/mine.png" />' +
				'<div style="background:url(https://img.daisyui.com/b.webp)"></div></section>',
			counterIds()
		)
		replaceDemoImages(nodes, 'assets/placeholder.svg')
		const out = serializeHtml(nodes)
		expect(out).not.toContain('daisyui.com')
		expect(out).not.toContain('srcset')
		expect(out).toContain('src="assets/placeholder.svg"')
		expect(out).toContain('src="assets/mine.png"')
		expect(out).toContain('url(assets/placeholder.svg)')
		expect(out).toContain('id="s"')
	})
})
