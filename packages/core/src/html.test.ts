import { describe, expect, it } from 'vitest'
import { counterIds } from './ids'
import { parseHtml, parseSection, serializeHtml } from './html'
import type { ElementNode, TreeNode } from './types'

// Ids differ between parses, compare structure only
const strip = (nodes: TreeNode[]): unknown[] =>
	nodes.map((node) =>
		node.type === 'element'
			? { ...node, id: undefined, children: strip(node.children) }
			: { ...node, id: undefined }
	)

const SECTION = `
<section class="hero  min-h-96 bg-base-200">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold" data-edit="text">Hello there</h1>
			<p class="py-6" data-edit="rich">Provident <strong>cupiditate</strong> voluptatem.</p>
			<ul class="flex gap-2">
				<li data-repeat="feature"><a class="link" href="/a" data-edit="link">One</a></li>
				<li data-repeat="feature"><a class="link" href="/b" data-edit="link">Two</a></li>
			</ul>
			<img src="assets/hero.png" alt="" data-edit="image">
			<button class="btn btn-primary">Get Started</button>
		</div>
	</div>
</section>
`

describe('parseHtml', () => {
	it('reads classes, attributes and builder markers', () => {
		const [section] = parseHtml(SECTION, counterIds()) as ElementNode[]
		expect(section.tag).toBe('section')
		expect(section.classes).toBe('hero min-h-96 bg-base-200')
		const h1 = (section.children[0] as ElementNode)
			.children[0] as ElementNode
		const title = h1.children[0] as ElementNode
		expect(title.slot).toBe('text')
		expect(title.attrs).toEqual({})
		const list = h1.children[2] as ElementNode
		expect(list.children.map((li) => (li as ElementNode).repeat)).toEqual([
			'feature',
			'feature',
		])
		const image = h1.children[3] as ElementNode
		expect(image).toMatchObject({
			tag: 'img',
			slot: 'image',
			attrs: { src: 'assets/hero.png', alt: '' },
		})
	})

	it('drops indentation but keeps meaningful spaces', () => {
		const [p] = parseHtml(
			'<p>\n\t<b>a</b> <i>b</i>\n</p>',
			counterIds()
		) as ElementNode[]
		expect(
			p.children.map((c) => (c.type === 'text' ? `"${c.text}"` : c.tag))
		).toEqual(['b', '" "', 'i'])
	})

	it('keeps svg attribute case and whitespace in pre', () => {
		const [svg, pre] = parseHtml(
			'<svg viewBox="0 0 24 24"><path d="M0 0"/></svg><pre>a\n  b</pre>',
			counterIds()
		) as ElementNode[]
		expect(svg.attrs.viewBox).toBe('0 0 24 24')
		expect((pre.children[0] as { text: string }).text).toBe('a\n  b')
	})

	it('rejects unknown slot kinds', () => {
		expect(() => parseHtml('<p data-edit="video"></p>')).toThrow(
			/data-edit="video"/
		)
	})
})

describe('parseSection', () => {
	it('marks the root as a locked section', () => {
		const section = parseSection({
			id: 'hero-centered',
			name: 'Hero',
			category: 'hero',
			html: SECTION,
		})
		expect(section.section).toEqual({
			preset: 'hero-centered',
			locked: true,
		})
	})

	it('needs exactly one root element', () => {
		expect(() =>
			parseSection({
				id: 'x',
				name: 'X',
				category: 'x',
				html: '<div></div><div></div>',
			})
		).toThrow(/exactly one root/)
	})
})

describe('serializeHtml', () => {
	it('round-trips without losing anything', () => {
		const tree = parseHtml(SECTION)
		const again = parseHtml(serializeHtml(tree, { markers: true }))
		expect(strip(again)).toEqual(strip(tree))
	})

	it('leaves builder markers out of the export', () => {
		const html = serializeHtml(parseHtml(SECTION))
		expect(html).not.toMatch(/data-edit|data-repeat/)
		expect(html).toContain('<a class="link" href="/a">One</a>')
	})

	it('prints blocks on their own lines and inline content as is', () => {
		const html = serializeHtml(
			parseHtml(
				'<div class="card"><h2>Title</h2><p>Text <b>bold</b></p><div><span>a</span><span>b</span></div></div>'
			)
		)
		expect(html).toBe(
			[
				'<div class="card">',
				'\t<h2>Title</h2>',
				'\t<p>Text <b>bold</b></p>',
				'\t<div><span>a</span><span>b</span></div>',
				'</div>',
			].join('\n')
		)
	})

	it('writes void elements, boolean attributes and escapes', () => {
		const html = serializeHtml(
			parseHtml(
				'<input type="checkbox" checked class="checkbox"><p title="a &quot;b&quot;">1 &lt; 2 &amp; 3</p><br>'
			)
		)
		expect(html).toBe(
			'<input class="checkbox" type="checkbox" checked>\n<p title="a &quot;b&quot;">1 &lt; 2 &amp; 3</p>\n<br>'
		)
	})

	it('keeps script content raw and self-closes empty svg children', () => {
		const html = serializeHtml(
			parseHtml(
				'<script>if (a < b && c) go()</script><svg viewBox="0 0 1 1"><path d="M0 0"></path></svg>'
			)
		)
		expect(html).toBe(
			'<script>if (a < b && c) go()</script>\n<svg viewBox="0 0 1 1"><path d="M0 0" /></svg>'
		)
	})
})

describe('block text edges', () => {
	it('trims spaces at the edges of block content only', () => {
		const [h1, span] = parseHtml(
			'<h1>\n\tBuild <b>pages</b> fast\n</h1><span> a </span>'
		) as ElementNode[]
		expect(serializeHtml([h1])).toBe('<h1>Build <b>pages</b> fast</h1>')
		expect(serializeHtml([span])).toBe('<span> a </span>')
	})
})

describe('node ids', () => {
	it('marks elements for the canvas when asked', () => {
		const tree = parseHtml('<p class="a">x</p>', counterIds())
		expect(serializeHtml(tree, { nodeIds: true })).toBe(
			'<p data-node-id="n1" class="a">x</p>'
		)
	})
})
