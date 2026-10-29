import { ancestorsOf, findElement, type ElementNode } from '@ui-system/core'
import { getSectionPreset } from '@ui-system/blocks/sections'

const SLOT_LABEL = { text: 'Text', rich: 'Text', image: 'Image', link: 'Link' }

export const labelOf = (node: ElementNode) => {
	if (node.section) {
		return getSectionPreset(node.section.preset)?.name ?? 'Section'
	}
	if (node.slot) return SLOT_LABEL[node.slot]
	if (node.repeat) return 'Item'
	return node.tag
}

// In a locked section only slots, repeat items and the section itself are picked
export const pickTarget = (roots: ElementNode[], id: string | null) => {
	if (!id) return null
	const node = findElement(roots, id)
	if (!node) return null
	const chain = [...ancestorsOf(roots, id), node].reverse()
	const section = chain.find((el) => el.section)
	if (section && !section.section?.locked) return node.id
	const target = chain.find((el) => el.slot || el.repeat || el.section)
	return target?.id ?? null
}
