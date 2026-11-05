import { describe, expect, it } from 'vitest'
import { assertComponent } from './validate'

const root = { id: 'r', type: 'element', tag: 'div', children: [] }
const base = { id: 'c1', name: 'Card', root }

describe('assertComponent variants and props', () => {
	it('accepts a component without them and with valid ones', () => {
		expect(() => assertComponent(base)).not.toThrow()
		expect(() =>
			assertComponent({
				...base,
				variants: [
					{
						id: 'v1',
						name: 'Dark',
						diffs: { r: { add: ['bg-black'], remove: [] } },
					},
				],
				props: [{ id: 'p1', label: 'Title', kind: 'text', node: 'r' }],
			})
		).not.toThrow()
	})

	it.each([
		['variants not a list', { variants: {} }],
		[
			'variant without name',
			{ variants: [{ id: 'v', name: ' ', diffs: {} }] },
		],
		[
			'duplicate variant ids',
			{
				variants: [
					{ id: 'v', name: 'A', diffs: {} },
					{ id: 'v', name: 'B', diffs: {} },
				],
			},
		],
		[
			'diff with a non-string token',
			{
				variants: [
					{
						id: 'v',
						name: 'A',
						diffs: { r: { add: [1], remove: [] } },
					},
				],
			},
		],
		[
			'diff without remove',
			{ variants: [{ id: 'v', name: 'A', diffs: { r: { add: [] } } }] },
		],
		[
			'unknown prop kind',
			{ props: [{ id: 'p', label: 'A', kind: 'color', node: 'r' }] },
		],
		[
			'prop without node',
			{ props: [{ id: 'p', label: 'A', kind: 'text' }] },
		],
	])('rejects %s', (_, extra) => {
		expect(() => assertComponent({ ...base, ...extra })).toThrow(/Invalid/)
	})

	it('checks the instance marker on the root', () => {
		const bad = { ...root, instance: { component: 'c', hidden: [1] } }
		expect(() => assertComponent({ ...base, root: bad })).toThrow(/Invalid/)
		const ok = { ...root, instance: { component: 'c', variant: 'v' } }
		expect(() => assertComponent({ ...base, root: ok })).not.toThrow()
	})
})
