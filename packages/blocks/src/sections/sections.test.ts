import { describe, expect, it } from 'vitest'
import { parseSection, serializeHtml, type ElementNode } from '@ui-system/core'
import { sectionCategories, sectionPresets } from '.'

const hasSlot = (node: ElementNode): boolean =>
	Boolean(node.slot) ||
	node.children.some((child) => child.type === 'element' && hasSlot(child))

describe('section presets', () => {
	it('have unique ids and known categories', () => {
		const ids = sectionPresets.map((preset) => preset.id)
		expect(new Set(ids).size).toBe(ids.length)
		const categories = sectionCategories.map((category) => category.id)
		for (const preset of sectionPresets) {
			expect(categories).toContain(preset.category)
		}
	})

	it.each(sectionPresets.map((preset) => [preset.id, preset] as const))(
		'%s parses into one section with editable places',
		(_, preset) => {
			const section = parseSection(preset)
			expect(section.section?.preset).toBe(preset.id)
			expect(hasSlot(section)).toBe(true)
			expect(serializeHtml([section])).not.toMatch(
				/data-edit|data-repeat/
			)
		}
	)
})
