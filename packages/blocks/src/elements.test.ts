import { describe, expect, it } from 'vitest'
import {
	isElement,
	parseHtml,
	serializeHtml,
	walk,
	type ElementNode,
} from '@ui-system/core'
import { elementCategories, getElementVariant } from '.'

const variants = elementCategories.flatMap((c) => c.variants)

const rootsOf = (html: string) =>
	parseHtml(html).filter((n) => isElement(n) || n.text.trim())

describe('element library', () => {
	it('hides categories that need scripts or are pinned to the viewport', () => {
		const slugs = elementCategories.map((c) => c.slug)
		for (const hidden of [
			'calendar',
			'countdown',
			'dropdown',
			'megamenu',
			'modal',
			'theme-controller',
			'drawer',
			'toast',
			'fab',
			'dock',
		])
			expect(slugs).not.toContain(hidden)
		expect(slugs).toContain('card')
	})

	it('keeps the order of the catalog and unique variant ids', () => {
		const ids = variants.map((v) => v.id)
		expect(new Set(ids).size).toBe(ids.length)
		expect(getElementVariant('card/default')?.title).toBe('Default')
		expect(getElementVariant('modal/default')).toBeUndefined()
	})

	it.each(variants.map((v) => [v.id, v] as const))(
		'%s is one labelled root without duplicate ids',
		(_, variant) => {
			const roots = rootsOf(variant.html)
			expect(roots).toHaveLength(1)
			const [root] = roots as ElementNode[]
			expect(root.type).toBe('element')
			expect(root.label).toBeTruthy()
			const ids: string[] = []
			walk(roots, (n) => {
				if (isElement(n) && n.attrs.id) ids.push(n.attrs.id)
			})
			expect(new Set(ids).size).toBe(ids.length)
			expect(variant.html).not.toMatch(/<script/)
			// Markers round trip, only the label is expected
			expect(serializeHtml(roots, { markers: true })).toBe(variant.html)
		}
	)

	it('wraps several roots and labels them with the component name', () => {
		const [root] = rootsOf(
			getElementVariant('button/colors')!.html
		) as ElementNode[]
		expect(root.label).toBe('Button')
		expect(root.classes).toBe('flex flex-wrap items-center gap-2')
		expect(root.children.length).toBe(8)
		const [accordion] = rootsOf(
			getElementVariant('accordion/default')!.html
		) as ElementNode[]
		expect(accordion.classes).toBe('flex flex-col gap-2')
	})

	it('strips demo widths and keeps a single root as it is', () => {
		const [card] = rootsOf(
			getElementVariant('card/default')!.html
		) as ElementNode[]
		expect(card.label).toBe('Card')
		expect(card.classes).not.toMatch(/\bw-80\b/)
		expect(card.classes).toContain('card')
	})
})
