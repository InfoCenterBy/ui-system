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
			getElementVariant('badge/in-button')!.html
		) as ElementNode[]
		expect(root.label).toBe('Badge')
		expect(root.classes).toBe('flex flex-wrap items-center gap-2')
		expect(root.children.length).toBeGreaterThan(1)
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

	it('marks the items of dropdowns, accordions, menus, steps and tables', () => {
		const repeatsOf = (id: string) => {
			const groups: Record<string, number> = {}
			walk(rootsOf(getElementVariant(id)!.html), (n) => {
				if (isElement(n) && n.repeat)
					groups[n.repeat] = (groups[n.repeat] ?? 0) + 1
			})
			return groups
		}
		for (const id of [
			'dropdown/details',
			'dropdown/hover',
			'dropdown/popover',
		])
			expect(repeatsOf(id)).toEqual({ li: 2 })
		expect(repeatsOf('accordion/default')).toEqual({ collapse: 3 })
		expect(repeatsOf('accordion/joined')).toEqual({ collapse: 3 })
		// The title entries stay out of the group
		expect(repeatsOf('menu/with-title')).toEqual({ li: 3 })
		expect(repeatsOf('menu/submenu').li).toBe(8)
		expect(repeatsOf('steps/default')).toEqual({ step: 4 })
		expect(repeatsOf('table/default')).toEqual({ tr: 3 })
		// Tab and panel pairs cannot be duplicated one by one
		expect(repeatsOf('tabs/with-content')).toEqual({})
		expect(repeatsOf('tabs/border')).toEqual({ tab: 3 })
		expect(getElementVariant('menu/default')!.html).toContain(
			'data-repeat="li"'
		)
	})

	it('hides variants that only show a range of colors, sizes or positions', () => {
		for (const id of [
			'button/colors',
			'button/sizes',
			'badge/colors',
			'tooltip/positions',
			'tabs/sizes',
			'card/sizes',
			'chat/colors',
			'navbar/colors',
		])
			expect(getElementVariant(id)).toBeUndefined()
		expect(getElementVariant('loading/types')).toBeDefined()
	})

	it('keeps the first instance of single variants without a wrapper', () => {
		for (const id of [
			'button/soft',
			'button/shapes',
			'badge/styles',
			'alert/dash',
			'dropdown/positions',
			'progress/default',
			'stack/directions',
			'loading/types',
			'mask/shapes',
			'megamenu/sizes',
		]) {
			const roots = rootsOf(getElementVariant(id)!.html) as ElementNode[]
			expect(roots).toHaveLength(1)
			expect(roots[0].classes).not.toMatch(/flex/)
		}
	})

	it('never makes the root of an element a repeat item', () => {
		for (const v of variants) {
			const [root] = rootsOf(v.html) as ElementNode[]
			expect(root.repeat).toBeUndefined()
		}
	})
})
