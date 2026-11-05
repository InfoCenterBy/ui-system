import {
	addRepeatItem,
	applyClassesToItems,
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
	replaceDemoImages,
	removeNode,
	removeRepeatItem,
	sectionOf,
	replaceChildren,
	shiftRepeatItem,
	variantOf,
	updateElement,
	walk,
	writeRevealConfig,
	type ElementNode,
	type ElementPatch,
	type NodeId,
	type RevealConfig,
	type SectionPreset,
	type SlotKind,
	type TreeNode,
} from '@ui-system/core'
import { getSectionPreset, sharedRoleOf } from '@ui-system/blocks/sections'
import { canBecomeLink } from '@/editor/properties/linkable'
import {
	isValidPopupId,
	popupIdTaken,
	popupKind,
	retargetTriggers,
} from '@/editor/properties/popups'
import { scopeOf } from '@/editor/canvas/nodes'
import { api } from '@/api'
import { t } from '@/i18n'
import { useDocument } from '@/store/document'
import { setVariantClasses } from '@/store/variantActions'
import type { Doc } from '@/store/history'
import { useNav } from '@/editor/navigator/navState'
import { fillMenuDraft } from '@/store/menuSync'
import { useProject } from '@/store/project'
import { addSlides, moveSlide, removeSlide, slideImage } from '@/store/carousel'

type PartialName = 'header' | 'footer'

const pageId = () => {
	const id = useProject.getState().currentPageId
	if (!id) throw new Error(t('err.noPage'))
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
		throw new Error(t('err.finishEditing'))
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

// The server always writes the placeholder under this name
const PLACEHOLDER_SRC = 'assets/placeholder.svg'

// Section from a preset, demo photos point at the local placeholder; the file is written in the background
const presetSection = (preset: SectionPreset) => {
	const section = parseSection(preset)
	const before = JSON.stringify(section)
	replaceDemoImages([section], PLACEHOLDER_SRC)
	if (JSON.stringify(section) !== before) void placeholderPath()
	return section
}

export const addSection = (presetId: string, index?: number) => {
	const preset = getSectionPreset(presetId)
	if (!preset) throw new Error(`Unknown section ${presetId}`)
	const section = presetSection(preset)
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

const editCarousel = (
	label: string,
	carouselId: NodeId,
	change: (carousel: ElementNode) => void
) =>
	editNode(
		label,
		carouselId,
		(list) => {
			const carousel = findElement(list, carouselId)
			if (carousel) change(carousel)
		},
		undefined,
		inFreeScope
	)

export const addCarouselSlides = (carouselId: NodeId, sources: string[]) => {
	let first: NodeId | null = null
	editCarousel('Add slides', carouselId, (carousel) => {
		const added = addSlides(carousel, sources, randomId)
		first = (added[0] && slideImage(added[0])?.id) ?? added[0]?.id ?? null
	})
	if (first) useProject.getState().select(first)
}

export const removeCarouselSlide = (carouselId: NodeId, slideId: NodeId) => {
	editCarousel('Remove slide', carouselId, (carousel) =>
		removeSlide(carousel, slideId)
	)
	useProject.getState().select(carouselId)
}

export const moveCarouselSlide = (
	carouselId: NodeId,
	slideId: NodeId,
	step: -1 | 1
) =>
	editCarousel('Move slide', carouselId, (carousel) =>
		moveSlide(carousel, slideId, step)
	)

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

// Describes an image, or marks it decorative (empty alt plus role) in one undo step
export const setImageAlt = (id: NodeId, alt: string, decorative = false) =>
	editNode(
		'Set alt',
		id,
		(list) => {
			const node = findElement(list, id)
			if (!node) return
			node.attrs.alt = decorative ? '' : alt
			if (decorative) node.attrs.role = 'presentation'
			else if (node.attrs.role === 'presentation') delete node.attrs.role
		},
		`alt:${id}`
	)

// Appear-on-scroll settings: free scope, or the section root even when it is locked
export const setReveal = (id: NodeId, config: RevealConfig) =>
	editNode(
		'Set reveal',
		id,
		(list) => {
			const node = findElement(list, id)
			if (node) node.attrs = writeRevealConfig(node.attrs, config)
		},
		`reveal:${id}`,
		(list, nodeId) =>
			inFreeScope(list, nodeId) ||
			Boolean(findElement(list, nodeId)?.section)
	)

// Points a button or link at a popup in one undo step, naming the popup when it has no id
export const linkPopup = (
	triggerId: NodeId,
	attrs: Record<string, string | null>,
	named?: { nodeId: NodeId; id: string }
) =>
	useDocument.getState().edit('Open popup', (draft) => {
		const list = listOf(draft, triggerId)
		const trigger = list && findElement(list, triggerId)
		// Link slots change their href in locked sections too
		if (
			!trigger ||
			(trigger.slot !== 'link' && !inFreeScope(list, triggerId))
		)
			return
		for (const [name, value] of Object.entries(attrs)) {
			if (value === null) delete trigger.attrs[name]
			else trigger.attrs[name] = value
		}
		const popupList = named && listOf(draft, named.nodeId)
		const popup = popupList && findElement(popupList, named.nodeId)
		if (popup && named) popup.attrs.id = named.id
	})

// Renames a modal or popover id, links and buttons that open it follow in the same undo step
export const renamePopupId = (popupId: NodeId, next: string) =>
	useDocument.getState().edit('Rename popup id', (draft) => {
		const list = listOf(draft, popupId)
		const popup = list && findElement(list, popupId)
		if (!list || !popup || !popupKind(popup)) return
		if (!inFreeScope(list, popupId)) return
		const from = popup.attrs.id
		if (!isValidPopupId(next) || next === from) return
		const { header, footer } = draft.partials
		const partials = [header, footer].filter((n) => n !== null)
		const inPartial = partials.some((p) => locate([p], popupId))
		const inMaster = Object.values(draft.components).some((c) =>
			locate([c.root], popupId)
		)
		// Page popups are used on that page and in the shared parts,
		// shared popups on every page, a master only inside itself
		const scope: TreeNode[] = inMaster
			? list
			: [
					...partials,
					...(inPartial
						? Object.values(draft.pages).flatMap((p) => p.sections)
						: (draft.pages[pageId()]?.sections ?? [])),
				]
		if (popupIdTaken(scope, next, popupId)) return
		popup.attrs.id = next
		if (from) retargetTriggers(scope, from, next)
	})

export const patchElement = (id: NodeId, patch: ElementPatch, label = 'Edit') =>
	editNode(
		label,
		id,
		(list) => updateElement(list, id, patch),
		undefined,
		inFreeScope
	)

// Copies the classes of a node inside a repeat item to the same place in the other items
export const applyStylesToItems = (id: NodeId) =>
	editNode(
		'Apply styles to all items',
		id,
		(list) => applyClassesToItems(list, id),
		undefined,
		inFreeScope
	)

// A plain button becomes an anchor with the same classes and children, one undo step
export const convertToLink = (id: NodeId) =>
	editNode(
		'Make it a link',
		id,
		(list) => {
			const node = findElement(list, id)
			if (!node || node.instance || !canBecomeLink(node)) return
			node.tag = 'a'
			delete node.attrs.type
			delete node.attrs.disabled
			node.attrs.href = '#'
		},
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
		draft.partials[name] = preset ? presetSection(preset) : null
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
		const next = presetSection(preset)
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

// Rewrites the header menu so it lists the site pages in order
export const fillMenuWithPages = () =>
	useDocument.getState().edit('Fill menu with pages', fillMenuDraft)

// Unlocked sections are edited as a free tree of elements
export const setSectionLocked = (id: NodeId, locked: boolean) =>
	editNode(locked ? 'Lock section' : 'Unlock section', id, (list) => {
		const node = findElement(list, id)
		if (node?.section && !node.instance) node.section.locked = locked
	})

// Typing in the class field merges into one undo step per element
// While a component variant is edited the change goes into the variant diff
export const setClasses = (id: NodeId, classes: string) => {
	const { editingComponentId, editingVariantId } = useProject.getState()
	if (editingComponentId && editingVariantId) {
		const root =
			useDocument.getState().doc?.components[editingComponentId]?.root
		if (root && inFreeScope([root], id)) {
			setVariantClasses(editingComponentId, editingVariantId, id, classes)
		}
		return
	}
	return editNode(
		'Change classes',
		id,
		(list) => updateElement(list, id, { classes }),
		`classes:${id}`,
		inFreeScope
	)
}

// Classes of several elements in one undo step, e.g. a grid and its first item
export const setClassesMany = (changes: { id: NodeId; classes: string }[]) => {
	if (changes.length === 0) return
	if (useProject.getState().editingVariantId) {
		for (const change of changes) setClasses(change.id, change.classes)
		return
	}
	editNode(
		'Change classes',
		changes[0].id,
		(list) => {
			for (const { id, classes } of changes) {
				if (inFreeScope(list, id)) updateElement(list, id, { classes })
			}
		},
		undefined,
		inFreeScope
	)
}

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
export const placeholderPath = () => {
	const project = useProject.getState().projectPath
	if (!placeholder || placeholder.project !== project) {
		placeholder = {
			project,
			path: api.placeholder().then(
				(r) => r.path,
				() => undefined
			),
		}
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
	if (!title) throw new Error(t('err.componentName'))
	assertNotEditingComponent()
	const id = randomId()
	useDocument.getState().edit(`Create component ${title}`, (draft) => {
		const roots = pageRoots(draft)
		const node = findElement(roots, nodeId)
		if (!node) throw new Error('Node is not in a page or partial')
		if (isSharedPart(draft.partials, nodeId)) {
			throw new Error(t('err.partialComponent'))
		}
		const topLevel = roots.some((root) => root.id === nodeId)
		if (!topLevel) {
			const section = sectionOf(roots, nodeId)
			if (!section || section.section?.locked) {
				throw new Error(t('err.locked'))
			}
		}
		if (ancestorsOf(roots, nodeId).some((a) => a.instance)) {
			throw new Error(t('err.inInstance'))
		}
		if (hasInstance(node)) {
			throw new Error(t('err.nested'))
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
			throw new Error(t('err.sectionComponent'))
		}
		const roots = pageRoots(draft)
		const parent = findElement(roots, parentId)
		const section = parent && sectionOf(roots, parentId)
		if (!parent || !section || section.section?.locked) {
			throw new Error(t('err.parentUnlocked'))
		}
		if (instanceAround(roots, parentId)) {
			throw new Error(t('err.parentInstance'))
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
			throw new Error(t('err.onlySection'))
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
		resetOverride(
			node,
			master.root,
			randomId,
			variantOf(master, instance?.instance?.variant)
		)
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
			const component = draft.components[componentId]
			const master = component?.root
			if (!node || !master || !isOverridden(node, master)) continue
			resetOverride(
				node,
				master,
				randomId,
				variantOf(component, instance.instance?.variant)
			)
		}
	})
}

export const renameComponent = (id: string, name: string) => {
	const title = name.trim()
	if (!title) throw new Error(t('err.componentName'))
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
