import { describe, expect, it } from 'vitest'
import { resolveDrop, zoneAt } from './dropPosition'

describe('zoneAt', () => {
	it('splits a row into quarters', () => {
		expect(zoneAt(1, 0, 28, true)).toBe('before')
		expect(zoneAt(14, 0, 28, true)).toBe('inside')
		expect(zoneAt(27, 0, 28, true)).toBe('after')
	})
	it('never returns inside for leaves', () => {
		expect(zoneAt(10, 0, 28, false)).toBe('before')
		expect(zoneAt(14, 0, 28, false)).toBe('after')
	})
})

describe('resolveDrop', () => {
	const target = { id: 't', parentId: 'p', index: 2, childCount: 3 }
	it('places before and after the target', () => {
		const from = { parentId: 'q', index: 0 }
		expect(resolveDrop('before', target, from)).toEqual({
			parentId: 'p',
			index: 2,
		})
		expect(resolveDrop('after', target, from)).toEqual({
			parentId: 'p',
			index: 3,
		})
	})
	it('shifts the index when moving forward in the same parent', () => {
		const from = { parentId: 'p', index: 0 }
		expect(resolveDrop('before', target, from)).toEqual({
			parentId: 'p',
			index: 1,
		})
		expect(resolveDrop('after', target, from)).toEqual({
			parentId: 'p',
			index: 2,
		})
	})
	it('keeps the index when moving backward', () => {
		const from = { parentId: 'p', index: 4 }
		expect(resolveDrop('before', target, from)?.index).toBe(2)
	})
	it('appends inside the target', () => {
		expect(
			resolveDrop('inside', target, { parentId: 'q', index: 1 })
		).toEqual({
			parentId: 't',
			index: 3,
		})
		expect(
			resolveDrop('inside', target, { parentId: 't', index: 0 })
		).toEqual({
			parentId: 't',
			index: 2,
		})
	})
	it('refuses before and after on a root', () => {
		const root = { id: 's', parentId: null, index: 0, childCount: 1 }
		expect(
			resolveDrop('after', root, { parentId: 's', index: 0 })
		).toBeNull()
		expect(
			resolveDrop('inside', root, { parentId: 'x', index: 0 })
		).toEqual({
			parentId: 's',
			index: 1,
		})
	})
})
