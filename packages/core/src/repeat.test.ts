import { describe, expect, it } from 'vitest'
import { counterIds } from './ids'
import { parseHtml } from './html'
import { findElement } from './tree'
import { applyClassesToItems, repeatPath } from './repeat'

// n1 section, n2 ul, n3 li a, n4 span, n5 text, n6 li b, n7 span, n8 text, n9 li c
const build = () =>
	parseHtml(
		'<section><ul><li data-repeat class="x"><span class="s1">a</span></li><li data-repeat class="x"><span>b</span></li><li data-repeat class="x">c</li></ul></section>',
		counterIds()
	)

describe('repeat styles', () => {
	it('finds the item and the path', () => {
		const list = build()
		expect(repeatPath(list, 'n4')?.path).toEqual([0])
		expect(repeatPath(list, 'n3')?.path).toEqual([])
		expect(repeatPath(list, 'n2')).toBeNull()
	})

	it('copies classes along the same path and skips missing ones', () => {
		const list = build()
		expect(applyClassesToItems(list, 'n4')).toBe(1)
		expect(findElement(list, 'n7')?.classes).toBe('s1')
		expect(applyClassesToItems(list, 'n2')).toBe(0)
	})

	it('copies the item root classes', () => {
		const list = build()
		findElement(list, 'n3')!.classes = 'x p-4'
		expect(applyClassesToItems(list, 'n3')).toBe(2)
		expect(findElement(list, 'n6')?.classes).toBe('x p-4')
	})
})
