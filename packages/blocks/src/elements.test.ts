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
	it('hides categories that are pinned to the viewport or switch the theme', () => {
		const slugs = elementCategories.map((c) => c.slug)
		for (const hidden of [
			'theme-controller',
			'drawer',
			'toast',
			'fab',
			'dock',
		])
			expect(slugs).not.toContain(hidden)
		for (const shown of [
			'calendar',
			'countdown',
			'dropdown',
			'megamenu',
			'modal',
			'card',
		])
			expect(slugs).toContain(shown)
	})

	it('keeps the order of the catalog and unique variant ids', () => {
		const ids = variants.map((v) => v.id)
		expect(new Set(ids).size).toBe(ids.length)
		expect(getElementVariant('card/default')?.title).toBe('Default')
		expect(getElementVariant('modal/default')?.title).toBe('Default')
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

	it('opens modals through commandfor without inline handlers', () => {
		for (const v of variants.filter((v) => v.id.startsWith('modal/'))) {
			expect(v.html).not.toContain('onclick')
			const [root] = rootsOf(v.html) as ElementNode[]
			const refs: string[] = []
			const ids: string[] = []
			walk([root], (n) => {
				if (!isElement(n)) return
				if (n.attrs.command === 'show-modal')
					refs.push(n.attrs.commandfor)
				if (n.tag === 'dialog') ids.push(n.attrs.id)
			})
			expect(refs).toHaveLength(1)
			expect(ids).toEqual(refs)
			expect(root.label).toBe('Modal')
		}
	})

	it('marks countdown units and the target date', () => {
		for (const v of variants.filter((v) => v.id.startsWith('countdown/'))) {
			const [root] = rootsOf(v.html) as ElementNode[]
			expect(root.attrs['data-countdown-to']).toBe('2026-12-31T00:00')
			const units: string[] = []
			walk([root], (n) => {
				if (isElement(n) && n.attrs['data-countdown'])
					units.push(n.attrs['data-countdown'])
			})
			expect(units.length).toBeGreaterThan(0)
		}
		const boxes = getElementVariant('countdown/boxes')!.html
		for (const unit of ['days', 'hours', 'minutes', 'seconds'])
			expect(boxes).toContain(`data-countdown="${unit}"`)
	})

	it('keeps popover dropdowns and calendars free of inline handlers', () => {
		expect(getElementVariant('dropdown/popover')!.html).toContain('popover')
		const calendar = getElementVariant('calendar/in-dropdown')!.html
		expect(calendar).toContain('calendar-date')
		expect(calendar).not.toContain('onchange')
	})
})
