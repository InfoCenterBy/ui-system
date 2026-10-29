import { describe, expect, it } from 'vitest'
import { matchScore, suggest } from './suggest'

const source = {
	utilities: ['bg-red-500', 'bg-red-50', 'bg-blue-500', 'p-4', 'rounded-box'],
	components: ['btn', 'btn-primary'],
	variants: ['hover', 'md', 'group-hover'],
}

describe('matchScore', () => {
	it('ranks prefix before segment before substring matches', () => {
		expect(matchScore('bg-re', 'bg-red-500')).toBe(0)
		expect(matchScore('b-r', 'bg-red-500')).toBe(1)
		expect(matchScore('red', 'bg-red-500')).toBe(2)
		expect(matchScore('ed-5', 'bg-red-500')).toBe(100)
		expect(matchScore('xyz', 'bg-red-500')).toBeNull()
	})
})

describe('suggest', () => {
	it('suggests nothing for an empty class', () => {
		expect(suggest('', source)).toEqual([])
		expect(suggest('md:', source)).toEqual([])
	})

	it('matches utilities by prefix, shorter first', () => {
		expect(suggest('bg-re', source).map((s) => s.name)).toEqual([
			'bg-red-50',
			'bg-red-500',
		])
	})

	it('puts components before utilities and variants last', () => {
		const names = suggest('b', source).map((s) => s.name)
		expect(names.slice(0, 2)).toEqual(['btn', 'btn-primary'])
		expect(suggest('ho', source).map((s) => s.name)).toContain('hover:')
	})

	it('keeps the variant prefix in the value', () => {
		const [first] = suggest('md:hover:p-', source)
		expect(first).toEqual({
			value: 'md:hover:p-4',
			name: 'p-4',
			kind: 'utility',
		})
	})
})
