import { describe, expect, it } from 'vitest'
import { alignCompanion, applyAlign, type AlignLayout } from './align'

const base: AlignLayout = {
	display: 'block',
	flexDirection: 'row',
	inline: false,
	shrinkWrapped: false,
	parentDisplay: 'block',
	parentFlexDirection: 'row',
}
const lay = (patch: Partial<AlignLayout>): AlignLayout => ({
	...base,
	...patch,
})

describe('alignCompanion', () => {
	it('maps flex row to justify-content', () => {
		const flex = lay({ display: 'inline-flex' })
		expect(alignCompanion(flex, 'text-left')).toEqual({
			group: 'justify-content',
			utility: 'justify-start',
		})
		expect(alignCompanion(flex, 'text-right')).toEqual({
			group: 'justify-content',
			utility: 'justify-end',
		})
		expect(alignCompanion(flex, 'text-justify')).toEqual({
			group: 'justify-content',
			utility: 'justify-start',
		})
	})
	it('maps flex column to align-items', () => {
		const col = lay({ display: 'flex', flexDirection: 'column-reverse' })
		expect(alignCompanion(col, 'text-center')).toEqual({
			group: 'align-items',
			utility: 'items-center',
		})
	})
	it('maps grid to justify-items', () => {
		expect(alignCompanion(lay({ display: 'grid' }), 'text-end')).toEqual({
			group: 'justify-items',
			utility: 'justify-items-end',
		})
		expect(
			alignCompanion(lay({ display: 'inline-grid' }), 'text-start')
		).toEqual({ group: 'justify-items', utility: 'justify-items-start' })
	})
	it('maps shrink-wrapped child of a column flex to align-self', () => {
		const l = lay({
			shrinkWrapped: true,
			parentDisplay: 'flex',
			parentFlexDirection: 'column',
		})
		expect(alignCompanion(l, 'text-center')).toEqual({
			group: 'align-self',
			utility: 'self-center',
		})
	})
	it('maps shrink-wrapped child of a grid to justify-self', () => {
		const l = lay({ shrinkWrapped: true, parentDisplay: 'grid' })
		expect(alignCompanion(l, 'text-right')).toEqual({
			group: 'justify-self',
			utility: 'justify-self-end',
		})
	})
	it('hints for shrink-wrapped in a row flex or block parent', () => {
		const wrap = 'As wide as its text: set a width or align the parent'
		expect(
			alignCompanion(
				lay({ shrinkWrapped: true, parentDisplay: 'flex' }),
				'text-center'
			)
		).toEqual({ hint: wrap })
		expect(
			alignCompanion(lay({ shrinkWrapped: true }), 'text-center')
		).toEqual({ hint: wrap })
	})
	it('moves a shrink-wrapped flex box by its parent', () => {
		const btn = lay({ display: 'inline-flex', shrinkWrapped: true })
		expect(alignCompanion(btn, 'text-right')).toEqual({
			hint: 'As wide as its text: set a width or align the parent',
		})
		expect(
			alignCompanion(
				{
					...btn,
					parentDisplay: 'flex',
					parentFlexDirection: 'column',
				},
				'text-right'
			)
		).toEqual({ group: 'align-self', utility: 'self-end' })
	})
	it('hints for inline elements', () => {
		expect(
			alignCompanion(
				lay({ display: 'inline', inline: true, shrinkWrapped: true }),
				'text-center'
			)
		).toEqual({ hint: 'Inline element: align its parent instead' })
	})
	it('needs nothing for a full width block', () => {
		expect(alignCompanion(base, 'text-center')).toBeNull()
	})
	it('ignores unknown alignments', () => {
		expect(alignCompanion(lay({ display: 'flex' }), 'text-foo')).toBeNull()
	})
})

describe('applyAlign', () => {
	const flex = lay({ display: 'flex' })
	it('writes both utilities at the breakpoint', () => {
		expect(applyAlign('btn', 'md', 'text-center', flex)).toBe(
			'btn md:text-center md:justify-center'
		)
	})
	it('writes only text-* without layout', () => {
		expect(applyAlign('btn', '', 'text-center', null)).toBe(
			'btn text-center'
		)
	})
	it('reset removes our companion only', () => {
		expect(
			applyAlign('btn text-center justify-center', '', null, flex)
		).toBe('btn')
		expect(
			applyAlign('btn text-center justify-between', '', null, flex)
		).toBe('btn justify-between')
	})
})
