import { describe, expect, it } from 'vitest'
import { buildIndex, classesOf, search } from './search'

const index = buildIndex({
	pages: [{ path: '/', name: 'All components' }],
	groupName: (id) => id,
	categories: [
		{
			slug: 'button',
			name: 'Button',
			group: 'actions',
			variants: [
				{
					name: 'soft',
					title: 'Soft',
					html: '<button class="btn btn-soft">A</button>',
				},
				{
					name: 'outline',
					title: 'Outline',
					html: '<button class="btn btn-outline">A</button>',
				},
			],
		},
		{
			slug: 'checkbox',
			name: 'Checkbox',
			group: 'data-input',
			variants: [
				{
					name: 'colors',
					title: 'Colors',
					html: '<input class="checkbox checkbox-primary" />',
				},
			],
		},
	],
})

const labels = (query) => search(index, query).map((r) => r.label)

describe('search', () => {
	it('collects class names from markup', () => {
		expect([
			...classesOf('<a class="btn  btn-soft"><b class="x">'),
		]).toEqual(['btn', 'btn-soft', 'x'])
	})

	it('shows pages and components for an empty query', () => {
		expect(labels('')).toEqual(['All components', 'Button', 'Checkbox'])
	})

	it('puts word starts first', () => {
		expect(labels('but')[0]).toBe('Button')
	})

	it('needs every word to match', () => {
		expect(labels('button soft')).toEqual(['Button / Soft'])
	})

	it('forgives typos', () => {
		expect(labels('buton')).toContain('Button')
		expect(labels('chekbox')).toContain('Checkbox')
	})

	it('finds variants by class name and says why', () => {
		const [first] = search(index, 'btn-soft')
		expect(first.label).toBe('Button / Soft')
		expect(first.hint).toBe('uses .btn-soft')
		expect(labels('checkbox-primary')).toContain('Checkbox / Colors')
	})

	it('returns nothing for unrelated text', () => {
		expect(labels('zzzz')).toEqual([])
	})
})
