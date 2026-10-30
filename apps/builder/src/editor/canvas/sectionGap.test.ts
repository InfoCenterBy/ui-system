import { describe, expect, it } from 'vitest'
import { gapAt } from './sectionGap'

const spans = [
	{ top: 0, bottom: 100 },
	{ top: 100, bottom: 300 },
]

describe('gapAt', () => {
	it('puts the line before the section when above its middle', () => {
		expect(gapAt(spans, 20)).toEqual({ index: 0, y: 0 })
		expect(gapAt(spans, 150)).toEqual({ index: 1, y: 100 })
	})
	it('puts the line after the section when below its middle', () => {
		expect(gapAt(spans, 70)).toEqual({ index: 1, y: 100 })
		expect(gapAt(spans, 250)).toEqual({ index: 2, y: 300 })
	})
	it('handles a page without sections', () => {
		expect(gapAt([], 40)).toEqual({ index: 0, y: 0 })
	})
})
