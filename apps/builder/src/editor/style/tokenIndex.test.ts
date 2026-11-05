import { describe, expect, it } from 'vitest'
import type { DesignToken } from '@ui-system/core'
import type { ClassIndex } from '@ui-system/theme/classes'
import { suggest } from '@/editor/style/suggest'
import { withTokens } from '@/editor/style/tokenIndex'

const base: ClassIndex = {
	utilities: ['bg-red-500', 'p-4'],
	components: [],
	variants: ['md'],
	cssOf: (name) => (name === 'p-4' ? 'padding: 1rem;' : null),
	colorOf: () => null,
}
const tokens: DesignToken[] = [
	{ name: 'brand', type: 'color', value: '#ff0000' },
	{ name: 'section', type: 'spacing', value: '6rem' },
]
const index = withTokens(base, tokens)

describe('withTokens', () => {
	it('keeps the index when there are no tokens', () => {
		expect(withTokens(base, [])).toBe(base)
	})

	it('knows token classes, also with variants', () => {
		expect(index.cssOf('bg-brand')).toContain('--color-brand: #ff0000')
		expect(index.cssOf('md:py-section')).toContain('--spacing-section')
		expect(index.cssOf('p-4')).toBe('padding: 1rem;')
		expect(index.cssOf('bg-unknown')).toBeNull()
	})

	it('gives the color of color tokens', () => {
		expect(index.colorOf('bg-brand/50')).toBe('#ff0000')
		expect(index.colorOf('py-section')).toBeNull()
	})

	it('suggests token classes', () => {
		const names = suggest('bg-br', index).map((s) => s.value)
		expect(names).toContain('bg-brand')
		expect(suggest('md:py-sec', index)[0].value).toBe('md:py-section')
	})
})
