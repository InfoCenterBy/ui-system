import { describe, expect, it } from 'vitest'
import type { ElementNode } from '@ui-system/core'
import { MOVE_THRESHOLD, canStartMove, passedThreshold } from './moveDrag'

const el = (
	id: string,
	tag: string,
	children: ElementNode['children'] = [],
	extra: Partial<ElementNode> = {}
): ElementNode => ({
	id,
	type: 'element',
	tag,
	classes: '',
	attrs: {},
	children,
	...extra,
})

describe('passedThreshold', () => {
	it('needs more than the threshold in screen pixels', () => {
		const o = { x: 0, y: 0 }
		expect(passedThreshold(o, { x: MOVE_THRESHOLD, y: 0 }, 1)).toBe(false)
		expect(passedThreshold(o, { x: 6, y: 0 }, 1)).toBe(true)
		expect(passedThreshold(o, { x: 8, y: 0 }, 0.5)).toBe(false)
		expect(passedThreshold(o, { x: 4, y: 4 }, 1)).toBe(true)
	})
})

describe('canStartMove', () => {
	const roots = [
		el('free', 'section', [el('box', 'div')], {
			section: { preset: 'custom-block', locked: false },
		}),
		el('locked', 'section', [el('inner', 'div')], {
			section: { preset: 'hero-simple', locked: true },
		}),
	]
	it('moves free-scope elements only', () => {
		expect(canStartMove(roots, 'box', false)).toBe(true)
		expect(canStartMove(roots, 'inner', false)).toBe(false)
	})
	it('never moves a section root or nothing', () => {
		expect(canStartMove(roots, 'free', false)).toBe(false)
		expect(canStartMove(roots, null, false)).toBe(false)
	})
})
