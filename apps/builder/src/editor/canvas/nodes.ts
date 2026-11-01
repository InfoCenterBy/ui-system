import {
	ancestorsOf,
	findElement,
	isTextLike,
	type ElementNode,
} from '@ui-system/core'
import { getSectionPreset } from '@ui-system/blocks/sections'
import { t, type Key } from '@/i18n'
import { sectionName } from '@/i18n/names'
import { useDocument } from '@/store/document'

const SLOT_LABEL: Record<NonNullable<ElementNode['slot']>, Key> = {
	text: 'node.text',
	rich: 'node.text',
	image: 'node.image',
	link: 'node.link',
}

export const labelOf = (node: ElementNode) => {
	if (node.instance) {
		const components = useDocument.getState().doc?.components
		return (
			components?.[node.instance.component]?.name ?? t('node.component')
		)
	}
	if (node.section) {
		const preset = getSectionPreset(node.section.preset)
		return preset ? sectionName(preset.name) : t('node.section')
	}
	if (node.slot) return t(SLOT_LABEL[node.slot])
	if (node.repeat) return t('node.item')
	return node.label ?? node.tag
}

export type Scope = 'free' | 'slots'

// How far a node may be edited. The nearest boundary around it decides: an
// instance root or a locked section allow slots only, an unlocked section or
// the component master being edited allow everything. An instance root itself
// lives in the scope of its container
export const scopeOf = (
	roots: ElementNode[],
	id: string,
	editing = false
): Scope => {
	const node = findElement(roots, id)
	if (!node) return 'slots'
	const chain = [...ancestorsOf(roots, id), node].reverse()
	const outer = node.instance ? chain.slice(1) : chain
	const boundary = outer.find((el) => el.instance || el.section)
	if (!boundary) return editing || node.instance ? 'free' : 'slots'
	if (boundary.instance) return 'slots'
	if (editing && boundary === roots[0]) return 'free'
	return boundary.section?.locked ? 'slots' : 'free'
}

// Free scope picks any element, otherwise only slots, repeat items, sections
// and instance roots are picked
export const pickTarget = (
	roots: ElementNode[],
	id: string | null,
	editing = false
) => {
	if (!id) return null
	const node = findElement(roots, id)
	if (!node) return null
	if (scopeOf(roots, id, editing) === 'free') return node.id
	const chain = [...ancestorsOf(roots, id), node].reverse()
	const target = chain.find(
		(el) => el.slot || el.repeat || el.section || el.instance
	)
	return target?.id ?? null
}

// How a double-click edits a node: its slot kind, or rich text in free scope
export const inlineKindOf = (
	roots: ElementNode[],
	node: ElementNode,
	editing = false
) => {
	if (node.slot === 'text' || node.slot === 'rich' || node.slot === 'link') {
		return node.slot
	}
	if (node.slot || node.instance) return null
	if (scopeOf(roots, node.id, editing) !== 'free') return null
	return isTextLike(node) ? 'rich' : null
}
