import {
	addRepeatItem,
	ancestorsOf,
	cloneNode,
	createComponent,
	detachInstance,
	hasInstance,
	isOverridden,
	materialize,
	resetOverride,
	duplicateNode,
	findElement,
	isElement,
	locate,
	moveNode,
	parseHtml,
	parseSection,
	prepareInsert,
	randomId,
	removeNode,
	removeRepeatItem,
	sectionOf,
	replaceChildren,
	shiftRepeatItem,
	updateElement,
	walk,
	type ElementNode,
	type ElementPatch,
	type NodeId,
	type SlotKind,
	type TreeNode,
} from '@ui-system/core'
import { getSectionPreset, sharedRoleOf } from '@ui-system/blocks/sections'
import { scopeOf } from '@/editor/canvas/nodes'
import { api } from '@/api'
import { useDocument } from '@/store/document'
import type { Doc } from '@/store/history'
import { useNav } from '@/editor/navigator/navState'
import { useProject } from '@/store/project'

type PartialName = 'header' | 'footer'

const pageId = () => {
	const id = useProject.getState().currentPageId
	if (!id) throw new Error('No page is open')
	return id
}

// The page sections and the partials, where instances live
const pageRoots = (draft: Doc): ElementNode[] => {
	const { header, footer } = draft.partials
	const sections = draft.pages[pageId()]?.sections ?? []
	return [header, ...sections, footer].filter((n) => n !== null)
}

// True when the node is the root of a component master
export const isComponentRoot = (doc: Doc, id: NodeId) =>
	Object.values(doc.components).some((c) => c.root.id === id)

// Header and footer, and everything inside them, are shared by every page
export const isSharedPart = (
	partials: Doc['partials'] | undefined,
	id: NodeId
) =>
	[partials?.header, partials?.footer].some(
		(root) => root != null && findElement([root], id) !== null
	)

// The list that holds a node in a page or partial, not in a component master
const pageListOf = (draft: Doc, id: NodeId): TreeNode[] | null => {
	const sections = draft.pages[pageId()]?.sections ?? []
	if (locate(sections, id)) return sections
	for (const name of ['header', 'footer'] as const) {
		const partial = draft.partials[name]
		if (partial && locate([partial], id)) return [partial]
	}
	return null
}

// Like pageListOf, but in component mode the master root is searched first
const listOf = (draft: Doc, id: NodeId): TreeNode[] | null => {
	const editing = useProject.getState().editingComponentId
	const root = editing ? draft.components[editing]?.root : undefined
	if (root && locate([root], id)) return [root]
	return pageListOf(draft, id)
}

// Swaps a node of a page or partial for another one, partial roots included
const replaceNode = (draft: Doc, id: NodeId, next: ElementNode) => {
	for (const name of ['header', 'footer'] as const) {
		if (draft.partials[name]?.id === id) {
			draft.partials[name] = next
			return true
		}
	}
	const at = locate(pageListOf(draft, id) ?? [], id)
	if (!at) return false
	at.list[at.index] = next
	return true
}

// The nearest instance around a node, the node itself counts
const instanceAround = (roots: ElementNode[], id: NodeId) => {
	const node = findElement(roots, id)
	if (node?.instance) return node
	return ancestorsOf(roots, id).findLast((el) => el.instance) ?? null
}

const assertNotEditingComponent = () => {
	if (useProject.getState().editingComponentId) {
		throw new Error('Finish editing the component first')
	}
}

type Guard = (list: TreeNode[], id: NodeId) => boolean

// Free scope: classes, styles and inner structure may change
const inFreeScope: Guard = (list, id) =>
	scopeOf(
		list as ElementNode[],
		id,
		Boolean(useProject.getState().editingComponentId)
	) === 'free'

// Moving, wrapping and removing: free scope, or a section root of the page.
// The master root of a component stays
const canRestructure: Guard = (list, id) => {
	const at = locate(list, id)
	if (!at) return false
	if (!at.parent) return !useProject.getState().editingComponentId
	return inFreeScope(list, id)
}

const editNode = (
	label: string,
	id: NodeId,
	change: (list: TreeNode[]) => void,
	mergeKey?: string,
	guard?: Guard
) =>
	useDocument.getState().edit(
		label,
		(draft) => {
			const list = listOf(draft, id)
			if (list && (!guard || guard(list, id))) change(list)
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
	editNode(
		'Duplicate',
		id,
		(list) => {
			copyId = duplicateNode(list, id, randomId).id
		},
		undefined,
		canRestructure
	)
	if (copyId) useProject.getState().select(copyId)
}

export const deleteNode = (id: NodeId) => {
	editNode(
		'Delete',
		id,
		(list) => void removeNode(list, id),
		undefined,
		canRestructure
	)
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
	editNode(
		label,
		id,
		(list) => updateElement(list, id, patch),
		undefined,
		inFreeScope
	)

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
	const { selectedId, editingComponentId } = useProject.getState()
	if (editingComponentId) {
		const root =
			useDocument.getState().doc?.components[editingComponentId]?.root
		// Anything but the root of the master can go
		if (selectedId && root && selectedId !== root.id) {
			if (findElement([root], selectedId)) deleteNode(selectedId)
		}
		return
	}
	const page = useDocument.getState().doc?.pages[pageId()]
	if (!selectedId || !page) return
	if (page.sections.some((section) => section.id === selectedId)) {
		deleteNode(selectedId)
		return
	}
	const { header, footer } = useDocument.getState().doc!.partials
	const roots = [header, ...page.sections, footer].filter((n) => n !== null)
	const node = findElement(roots, selectedId)
	const section = sectionOf(roots, selectedId)
	const insideInstance = ancestorsOf(roots, selectedId).some(
		(a) => a.instance
	)
	// Anything inside an unlocked section can go, except parts of an instance
	if (
		node &&
		section &&
		!section.section?.locked &&
		section.id !== node.id &&
		!insideInstance
	) {
		deleteNode(selectedId)
		return
	}
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
	assertNotEditingComponent()
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

// Unlocked sections are edited as a free tree of elements
export const setSectionLocked = (id: NodeId, locked: boolean) =>
	editNode(locked ? 'Lock section' : 'Unlock section', id, (list) => {
		const node = findElement(list, id)
		if (node?.section && !node.instance) node.section.locked = locked
	})

// Typing in the class field merges into one undo step per element
export const setClasses = (id: NodeId, classes: string) =>
	editNode(
		'Change classes',
		id,
		(list) => updateElement(list, id, { classes }),
		`classes:${id}`,
		inFreeScope
	)

// Inserts parsed HTML into a parent element at an index and selects the first new element
export const insertHtml = (parentId: NodeId, index: number, html: string) => {
	const nodes = parseHtml(html, randomId)
	let done = false
	editNode(
		'Insert element',
		parentId,
		(list) => {
			const parent = findElement(list, parentId)
			if (!parent || parent.instance) return
			done = true
			parent.children.splice(
				Math.max(0, Math.min(index, parent.children.length)),
				0,
				...nodes
			)
		},
		undefined,
		inFreeScope
	)
	const first = nodes.find(isElement)
	if (!done) return null
	if (first) useProject.getState().select(first.id)
	return first?.id ?? null
}

// One placeholder request per open project, a failure means no image swap
let placeholder: {
	project: string | null
	path: Promise<string | undefined>
} | null = null
const placeholderPath = () => {
	const project = useProject.getState().projectPath
	if (!placeholder || placeholder.project !== project) {
		const path = api.placeholder().then(
			(r) => r.path,
			() => undefined
		)
		placeholder = { project, path }
	}
	return placeholder.path
}

// Inserts a library element: fresh ids and names, local placeholder image, one undo step
export const insertElement = async (
	parentId: NodeId,
	index: number,
	html: string
) => {
	const imageSrc = await placeholderPath()
	const nodes = prepareInsert(parseHtml(html, randomId), {
		newId: () => randomId().slice(0, 6),
		imageSrc,
	})
	let done = false
	editNode(
		'Insert element',
		parentId,
		(list) => {
			const parent = findElement(list, parentId)
			if (!parent || parent.instance) return
			done = true
			parent.children.splice(
				Math.max(0, Math.min(index, parent.children.length)),
				0,
				...nodes
			)
		},
		undefined,
		inFreeScope
	)
	if (!done) return null
	const first = nodes.find(isElement)
	if (first) useProject.getState().select(first.id)
	useNav.getState().setOpen([parentId])
	return first?.id ?? null
}

// A new Custom block, optionally with a library element in its Content container.
// One undo step. Selects the container, or the new element when there is one
export const addCustomBlock = async (index?: number, html?: string) => {
	assertNotEditingComponent()
	const preset = getSectionPreset('custom-block')
	if (!preset) throw new Error('Unknown section custom-block')
	const section = parseSection(preset)
	const found: ElementNode[] = []
	walk([section], (n) => {
		if (isElement(n) && n.label === 'Content') found.push(n)
	})
	const container = found[0] ?? null
	let first: ElementNode | undefined
	if (html && container) {
		const imageSrc = await placeholderPath()
		const nodes = prepareInsert(parseHtml(html, randomId), {
			newId: () => randomId().slice(0, 6),
			imageSrc,
		})
		container.children.push(...nodes)
		first = nodes.find(isElement)
	}
	useDocument.getState().edit('Add Custom block', (draft) => {
		const sections = draft.pages[pageId()].sections
		sections.splice(
			Math.max(0, Math.min(index ?? sections.length, sections.length)),
			0,
			section
		)
	})
	const target = first ?? container ?? section
	useProject.getState().select(target.id)
	useNav.getState().setOpen([container?.id ?? section.id])
	return target.id
}

// Moves a node inside the same section, parentId is the new parent element
export const moveNodeTo = (id: NodeId, parentId: NodeId, index: number) =>
	editNode(
		'Move element',
		id,
		(list) => {
			const parent = findElement(list, parentId)
			if (!parent || parent.instance || !inFreeScope(list, parentId)) {
				return
			}
			moveNode(list, id, parentId, index)
		},
		undefined,
		canRestructure
	)

export const wrapNode = (id: NodeId, tag = 'div') => {
	const wrapperId = randomId()
	let done = false
	editNode(
		'Wrap element',
		id,
		(list) => {
			const at = locate(list, id)
			// Section roots cannot be wrapped
			if (!at?.parent) return
			done = true
			const [node] = at.list.splice(at.index, 1)
			at.list.splice(at.index, 0, {
				id: wrapperId,
				type: 'element',
				tag,
				classes: '',
				attrs: {},
				children: [node],
			})
		},
		undefined,
		canRestructure
	)
	if (done) useProject.getState().select(wrapperId)
}

const requireComponent = (draft: Doc, id: string) => {
	const component = draft.components[id]
	if (!component) throw new Error(`Unknown component ${id}`)
	return component
}

// Turns a section, or an element of an unlocked section, into a component and
// puts an instance in its place
export const createComponentFrom = (nodeId: NodeId, name: string) => {
	const title = name.trim()
	if (!title) throw new Error('A component needs a name')
	assertNotEditingComponent()
	const id = randomId()
	useDocument.getState().edit(`Create component ${title}`, (draft) => {
		const roots = pageRoots(draft)
		const node = findElement(roots, nodeId)
		if (!node) throw new Error('Node is not in a page or partial')
		if (isSharedPart(draft.partials, nodeId)) {
			throw new Error('Header and footer cannot be components')
		}
		const topLevel = roots.some((root) => root.id === nodeId)
		if (!topLevel) {
			const section = sectionOf(roots, nodeId)
			if (!section || section.section?.locked) {
				throw new Error('The section is locked')
			}
		}
		if (ancestorsOf(roots, nodeId).some((a) => a.instance)) {
			throw new Error('The node is part of an instance')
		}
		if (hasInstance(node)) {
			throw new Error('A component cannot contain another component')
		}
		const { component, instance } = createComponent(
			node,
			id,
			title,
			randomId
		)
		// Masters are edited as a free tree
		if (component.root.section) component.root.section.locked = false
		draft.components[id] = component
		replaceNode(draft, nodeId, instance)
	})
	useProject.getState().select(nodeId)
	return id
}

// Puts an instance of a component into an element of an unlocked section
export const insertInstance = (
	componentId: string,
	parentId: NodeId,
	index: number
) => {
	assertNotEditingComponent()
	let instanceId: NodeId | null = null
	useDocument.getState().edit('Insert component', (draft) => {
		const component = requireComponent(draft, componentId)
		if (component.root.section) {
			throw new Error('A section component goes in as a section')
		}
		const roots = pageRoots(draft)
		const parent = findElement(roots, parentId)
		const section = parent && sectionOf(roots, parentId)
		if (!parent || !section || section.section?.locked) {
			throw new Error('Parent must be inside an unlocked section')
		}
		if (instanceAround(roots, parentId)) {
			throw new Error('Parent is part of an instance')
		}
		const instance = materialize(component.root, componentId, randomId)
		instanceId = instance.id
		parent.children.splice(
			Math.max(0, Math.min(index, parent.children.length)),
			0,
			instance
		)
	})
	if (instanceId) useProject.getState().select(instanceId)
	return instanceId
}

// Adds an instance of a section component to the page
export const addInstanceSection = (componentId: string, index?: number) => {
	assertNotEditingComponent()
	let instanceId: NodeId | null = null
	useDocument.getState().edit('Add component', (draft) => {
		const component = requireComponent(draft, componentId)
		if (!component.root.section) {
			throw new Error('Only section components go in as a section')
		}
		const sections = draft.pages[pageId()].sections
		const instance = materialize(component.root, componentId, randomId)
		instanceId = instance.id
		sections.splice(index ?? sections.length, 0, instance)
	})
	if (instanceId) useProject.getState().select(instanceId)
	return instanceId
}

// The instance becomes a plain tree again
export const detach = (instanceId: NodeId) => {
	assertNotEditingComponent()
	useDocument.getState().edit('Detach component', (draft) => {
		const node = findElement(pageRoots(draft), instanceId)
		if (!node?.instance) throw new Error('Node is not an instance')
		const master = draft.components[node.instance.component]?.root
		replaceNode(draft, instanceId, detachInstance(node, master))
	})
}

// Puts the content of the master back into an overridden node of an instance
export const resetContent = (nodeId: NodeId) =>
	useDocument.getState().edit('Reset content', (draft) => {
		const roots = pageRoots(draft)
		const instance = instanceAround(roots, nodeId)
		const node = findElement(roots, nodeId)
		const master =
			instance && draft.components[instance.instance!.component]
		if (!node || !master) return
		if (!isOverridden(node, master.root)) return
		resetOverride(node, master.root, randomId)
	})

// Every overridden slot of an instance goes back to the master, one undo step
export const resetAllContent = (instanceId: NodeId) => {
	useDocument.getState().edit('Reset all content', (draft) => {
		const instance = findElement(pageRoots(draft), instanceId)
		if (!instance?.instance) return
		const componentId = instance.instance.component
		const ids: NodeId[] = []
		walk([instance], (node) => {
			const master = draft.components[componentId]?.root
			if (isElement(node) && master && isOverridden(node, master)) {
				ids.push(node.id)
			}
		})
		// Resetting a parent can replace its children, so each one is looked up again
		for (const id of ids) {
			const roots = pageRoots(draft)
			const node = findElement(roots, id)
			const master = draft.components[componentId]?.root
			if (!node || !master || !isOverridden(node, master)) continue
			resetOverride(node, master, randomId)
		}
	})
}

export const renameComponent = (id: string, name: string) => {
	const title = name.trim()
	if (!title) throw new Error('A component needs a name')
	useDocument.getState().edit('Rename component', (draft) => {
		requireComponent(draft, id).name = title
	})
}

// Every instance becomes a plain tree, then the master goes
export const deleteComponent = (id: string) => {
	useDocument.getState().edit('Delete component', (draft) => {
		const master = requireComponent(draft, id).root
		const visit = (list: TreeNode[]) => {
			for (let i = 0; i < list.length; i++) {
				const node = list[i]
				if (!isElement(node)) continue
				if (node.instance?.component === id) {
					list[i] = detachInstance(node, master)
				} else visit(node.children)
			}
		}
		for (const page of Object.values(draft.pages)) visit(page.sections)
		for (const name of ['header', 'footer'] as const) {
			const partial = draft.partials[name]
			if (!partial) continue
			const list: TreeNode[] = [partial]
			visit(list)
			draft.partials[name] = list[0] as ElementNode
		}
		delete draft.components[id]
	})
	const { editingComponentId, exitComponent } = useProject.getState()
	if (editingComponentId === id) exitComponent()
}
