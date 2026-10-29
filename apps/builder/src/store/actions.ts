import {
	addRepeatItem,
	cloneNode,
	duplicateNode,
	isElement,
	findElement,
	locate,
	parseSection,
	randomId,
	removeNode,
	removeRepeatItem,
	replaceChildren,
	shiftRepeatItem,
	updateElement,
	walk,
	type ElementNode,
	type ElementPatch,
	type SlotKind,
	type NodeId,
	type TreeNode,
} from '@ui-system/core'
import { getSectionPreset, sharedRoleOf } from '@ui-system/blocks/sections'
import { useDocument } from '@/store/document'
import type { Doc } from '@/store/history'
import { useProject } from '@/store/project'

type PartialName = 'header' | 'footer'

const pageId = () => {
	const id = useProject.getState().currentPageId
	if (!id) throw new Error('No page is open')
	return id
}

// The list that holds a node: the page sections or one of the partials
const listOf = (draft: Doc, id: NodeId): TreeNode[] | null => {
	const sections = draft.pages[pageId()]?.sections ?? []
	if (locate(sections, id)) return sections
	for (const name of ['header', 'footer'] as const) {
		const partial = draft.partials[name]
		if (partial && locate([partial], id)) return [partial]
	}
	return null
}

const editNode = (
	label: string,
	id: NodeId,
	change: (list: TreeNode[]) => void,
	mergeKey?: string
) =>
	useDocument.getState().edit(
		label,
		(draft) => {
			const list = listOf(draft, id)
			if (list) change(list)
		},
		{ mergeKey }
	)

export const addSection = (presetId: string, index?: number) => {
	const preset = getSectionPreset(presetId)
	if (!preset) throw new Error(`Unknown section ${presetId}`)
	const section = parseSection(preset)
	useDocument.getState().edit(`Add ${preset.name}`, (draft) => {
		const sections = draft.pages[pageId()].sections
		sections.splice(index ?? sections.length, 0, section)
	})
	useProject.getState().select(section.id)
	return section.id
}

export const moveSection = (id: NodeId, toIndex: number) =>
	useDocument.getState().edit('Move section', (draft) => {
		const sections = draft.pages[pageId()].sections
		const from = sections.findIndex((s) => s.id === id)
		if (from < 0) return
		const [section] = sections.splice(from, 1)
		sections.splice(
			Math.max(0, Math.min(toIndex, sections.length)),
			0,
			section
		)
	})

export const duplicateSection = (id: NodeId) => {
	let copyId: NodeId | null = null
	editNode('Duplicate', id, (list) => {
		copyId = duplicateNode(list, id, randomId).id
	})
	if (copyId) useProject.getState().select(copyId)
}

export const deleteNode = (id: NodeId) => {
	editNode('Delete', id, (list) => void removeNode(list, id))
	const { selectedId, select } = useProject.getState()
	if (selectedId === id) select(null)
}

// Typing in one slot within a short time is one undo step
export const setSlotContent = (id: NodeId, children: TreeNode[]) =>
	editNode(
		'Edit text',
		id,
		(list) => replaceChildren(list, id, children),
		`text:${id}`
	)

export const setAttribute = (id: NodeId, name: string, value: string | null) =>
	editNode(
		`Set ${name}`,
		id,
		(list) => {
			const node = findElement(list, id)
			if (!node) return
			if (value === null) delete node.attrs[name]
			else node.attrs[name] = value
		},
		`attr:${id}:${name}`
	)

export const patchElement = (id: NodeId, patch: ElementPatch, label = 'Edit') =>
	editNode(label, id, (list) => updateElement(list, id, patch))

export const addItem = (id: NodeId) => {
	let copyId: NodeId | null = null
	editNode('Add item', id, (list) => {
		copyId = addRepeatItem(list, id, randomId).id
	})
	if (copyId) useProject.getState().select(copyId)
}

export const removeItem = (id: NodeId) => {
	editNode('Remove item', id, (list) => removeRepeatItem(list, id))
	useProject.getState().select(null)
}

export const shiftItem = (id: NodeId, step: -1 | 1) =>
	editNode('Move item', id, (list) => shiftRepeatItem(list, id, step))

// Header and footer are shared by every page
export const setPartial = (name: PartialName, presetId: string | null) => {
	const preset = presetId ? getSectionPreset(presetId) : null
	if (presetId && !preset) throw new Error(`Unknown section ${presetId}`)
	useDocument.getState().edit(`Set ${name}`, (draft) => {
		draft.partials[name] = preset ? parseSection(preset) : null
	})
}

// Delete key: whole sections and repeat items, slots of a locked section stay
export const deleteSelected = () => {
	const { selectedId } = useProject.getState()
	const page = useDocument.getState().doc?.pages[pageId()]
	if (!selectedId || !page) return
	if (page.sections.some((section) => section.id === selectedId)) {
		deleteNode(selectedId)
		return
	}
	const { header, footer } = useDocument.getState().doc!.partials
	const roots = [header, ...page.sections, footer].filter((n) => n !== null)
	const node = findElement(roots, selectedId)
	if (node?.repeat) {
		try {
			removeItem(selectedId)
		} catch {
			// The last item of a group stays
		}
	}
}

const slotsByKind = (section: ElementNode) => {
	const found: Record<SlotKind, ElementNode[]> = {
		text: [],
		rich: [],
		image: [],
		link: [],
	}
	walk(section.children, (node) => {
		if (isElement(node) && node.slot) found[node.slot].push(node)
	})
	return found
}

// Replaces a section with another preset, slot contents carry over by order of kind
export const switchVariant = (sectionId: NodeId, presetId: string) => {
	const preset = getSectionPreset(presetId)
	if (!preset) throw new Error(`Unknown section ${presetId}`)
	useDocument.getState().edit('Switch variant', (draft) => {
		const sections = draft.pages[pageId()].sections
		const index = sections.findIndex((s) => s.id === sectionId)
		if (index < 0) return
		const next = parseSection(preset)
		const from = slotsByKind(sections[index])
		const to = slotsByKind(next)
		for (const kind of ['text', 'rich', 'link'] as const) {
			to[kind].forEach((target, n) => {
				const source = from[kind][n]
				if (!source) return
				target.children = source.children.map((child) =>
					cloneNode(child, randomId)
				)
				if (kind !== 'link') return
				for (const name of ['href', 'target', 'rel']) {
					if (name in source.attrs)
						target.attrs[name] = source.attrs[name]
					else delete target.attrs[name]
				}
			})
		}
		to.image.forEach((target, n) => {
			const source = from.image[n]
			if (!source) return
			for (const name of ['src', 'alt']) {
				if (name in source.attrs)
					target.attrs[name] = source.attrs[name]
			}
		})
		next.id = sectionId
		sections[index] = next
	})
	useProject.getState().select(sectionId)
}

// Header and footer presets replace the shared part, others go into the page
export const placePreset = (presetId: string, index?: number) => {
	const role = sharedRoleOf(presetId)
	if (!role) return addSection(presetId, index)
	setPartial(role, presetId)
	const partial = useDocument.getState().doc?.partials[role]
	if (partial) useProject.getState().select(partial.id)
	return partial?.id ?? null
}

const pageHref = (slug: string) => `${slug}.html`

// Rewrites the header menu so it lists the site pages in order
export const fillMenuWithPages = () =>
	useDocument.getState().edit('Fill menu with pages', (draft) => {
		const header = draft.partials.header
		if (!header) return
		let first: ElementNode | null = null
		walk([header], (node) => {
			if (!first && isElement(node) && node.repeat) {
				first = node
				return false
			}
		})
		const template = first as ElementNode | null
		if (!template) return
		const at = locate([header], template.id)
		if (!at) return
		const group = template.repeat
		const items = draft.site.pages.flatMap((id) => {
			const page = draft.pages[id]
			if (!page) return []
			const item = cloneNode(template, randomId)
			walk([item], (node) => {
				if (isElement(node) && node.slot === 'link') {
					node.attrs.href = pageHref(page.slug)
					node.children = [
						{ id: randomId(), type: 'text', text: page.name },
					]
				}
			})
			return [item]
		})
		// Old items of the group are replaced in place by the page links
		const kept = at.list.filter(
			(node) => !(isElement(node) && node.repeat === group)
		)
		const insertAt = at.list.findIndex(
			(node) => isElement(node) && node.repeat === group
		)
		at.list.splice(0, at.list.length, ...kept)
		at.list.splice(insertAt, 0, ...items)
	})
