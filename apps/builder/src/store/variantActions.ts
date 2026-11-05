import {
	diffClasses,
	findElement,
	instancesOf,
	isElement,
	isEmptyDiff,
	propKindsFor,
	randomId,
	resolveInstance,
	type ComponentProp,
	type ElementNode,
	type NodeId,
	type PropKind,
	type TreeNode,
} from '@ui-system/core'
import { t } from '@/i18n'
import { useDocument } from '@/store/document'
import type { Doc } from '@/store/history'
import { useProject } from '@/store/project'

// Variants and properties of components. Every change is one undo step; the
// document sync pass rebuilds the instances after the variants or props change

const requireComponent = (draft: Doc, id: string) => {
	const component = draft.components[id]
	if (!component) throw new Error(`Unknown component ${id}`)
	return component
}

const requireVariant = (draft: Doc, componentId: string, id: string) => {
	const variant = requireComponent(draft, componentId).variants?.find(
		(v) => v.id === id
	)
	if (!variant) throw new Error(`Unknown variant ${id}`)
	return variant
}

const cleanName = (name: string) => {
	const title = name.trim()
	if (!title) throw new Error(t('variants.errName'))
	return title
}

// Records the classes a master node has in a variant as a diff from the base
export const setVariantClasses = (
	componentId: string,
	variantId: string,
	nodeId: NodeId,
	classes: string
) =>
	useDocument.getState().edit(
		'Change variant classes',
		(draft) => {
			const component = requireComponent(draft, componentId)
			const variant = requireVariant(draft, componentId, variantId)
			const node = findElement([component.root], nodeId)
			if (!node) return
			const diff = diffClasses(node.classes, classes)
			if (isEmptyDiff(diff)) delete variant.diffs[nodeId]
			else variant.diffs[nodeId] = diff
		},
		{ mergeKey: `vclasses:${variantId}:${nodeId}` }
	)

// A new variant, empty or copied from another one. Returns its id
export const addVariant = (
	componentId: string,
	name: string,
	copyFrom?: string
) => {
	const title = cleanName(name)
	const id = randomId()
	useDocument.getState().edit('Add variant', (draft) => {
		const component = requireComponent(draft, componentId)
		const source = component.variants?.find((v) => v.id === copyFrom)
		const diffs = source ? JSON.parse(JSON.stringify(source.diffs)) : {}
		component.variants = [
			...(component.variants ?? []),
			{ id, name: title, diffs },
		]
	})
	return id
}

export const renameVariant = (
	componentId: string,
	variantId: string,
	name: string
) => {
	const title = cleanName(name)
	useDocument.getState().edit('Rename variant', (draft) => {
		requireVariant(draft, componentId, variantId).name = title
	})
}

const everyList = (draft: Doc): TreeNode[][] => [
	...Object.values(draft.pages).map((p) => p.sections),
	...(['header', 'footer'] as const).map((name) =>
		draft.partials[name] ? [draft.partials[name]] : []
	),
]

// Instances of a component using a variant: how many, and on which pages
export const variantUsage = (
	doc: Doc,
	componentId: string,
	variantId: string
) => {
	let count = 0
	const places: string[] = []
	const scan = (name: string, list: ElementNode[]) => {
		const hits = instancesOf([list], componentId).filter(
			(i) => i.instance?.variant === variantId
		)
		if (hits.length === 0) return
		count += hits.length
		places.push(name)
	}
	for (const page of Object.values(doc.pages)) scan(page.name, page.sections)
	for (const name of ['header', 'footer'] as const) {
		const partial = doc.partials[name]
		if (partial) scan(t(`variants.${name}`), [partial])
	}
	return { count, places }
}

// Instances that used the variant go back to the base look
export const deleteVariant = (componentId: string, variantId: string) => {
	useDocument.getState().edit('Delete variant', (draft) => {
		const component = requireComponent(draft, componentId)
		requireVariant(draft, componentId, variantId)
		component.variants = component.variants?.filter(
			(v) => v.id !== variantId
		)
	})
	const { editingVariantId, setEditingVariant } = useProject.getState()
	if (editingVariantId === variantId) setEditingVariant(null)
}

// Rebuilds one instance with a new choice, overrides and ids stay
const rebuildInstance = (
	draft: Doc,
	instanceId: NodeId,
	view: (current: NonNullable<ElementNode['instance']>) => {
		variant?: string
		hidden?: NodeId[]
	}
) => {
	for (const list of everyList(draft)) {
		const visit = (nodes: TreeNode[]): boolean => {
			for (let i = 0; i < nodes.length; i++) {
				const node = nodes[i]
				if (!isElement(node)) continue
				if (node.id === instanceId && node.instance) {
					const component = requireComponent(
						draft,
						node.instance.component
					)
					nodes[i] = resolveInstance(
						component,
						randomId,
						node,
						component.root,
						view(node.instance)
					)
					return true
				}
				if (visit(node.children)) return true
			}
			return false
		}
		if (visit(list)) {
			// A partial root lives in its slot, not in the list copy
			for (const name of ['header', 'footer'] as const) {
				if (draft.partials[name]?.id === instanceId) {
					draft.partials[name] = list[0] as ElementNode
				}
			}
			return
		}
	}
}

export const setInstanceVariant = (
	instanceId: NodeId,
	variantId: string | null
) =>
	useDocument.getState().edit('Choose variant', (draft) => {
		rebuildInstance(draft, instanceId, (info) => ({
			variant: variantId ?? undefined,
			hidden: info.hidden,
		}))
	})

export const setInstanceHidden = (
	instanceId: NodeId,
	nodeId: NodeId,
	hidden: boolean
) =>
	useDocument.getState().edit('Toggle element', (draft) => {
		rebuildInstance(draft, instanceId, (info) => {
			const rest = (info.hidden ?? []).filter((id) => id !== nodeId)
			return {
				variant: info.variant,
				hidden: hidden ? [...rest, nodeId] : rest,
			}
		})
	})

// Exposes a master node as a labelled field of every instance
export const addProp = (
	componentId: string,
	nodeId: NodeId,
	kind: PropKind,
	label: string
) => {
	const title = label.trim()
	if (!title) throw new Error(t('variants.errLabel'))
	useDocument.getState().edit('Add property', (draft) => {
		const component = requireComponent(draft, componentId)
		const node = findElement([component.root], nodeId)
		if (!node) return
		const isRoot = component.root.id === nodeId
		if (!propKindsFor(node, isRoot).includes(kind)) {
			throw new Error(t('variants.errKind'))
		}
		const props = component.props ?? []
		if (props.some((p) => p.node === nodeId && p.kind === kind)) return
		const prop: ComponentProp = {
			id: randomId(),
			label: title,
			kind,
			node: nodeId,
		}
		component.props = [...props, prop]
	})
}

export const renameProp = (
	componentId: string,
	propId: string,
	label: string
) => {
	const title = label.trim()
	if (!title) return
	useDocument.getState().edit(
		'Rename property',
		(draft) => {
			const prop = requireComponent(draft, componentId).props?.find(
				(p) => p.id === propId
			)
			if (prop) prop.label = title
		},
		{ mergeKey: `prop:${propId}` }
	)
}

export const removeProp = (componentId: string, propId: string) =>
	useDocument.getState().edit('Remove property', (draft) => {
		const component = requireComponent(draft, componentId)
		component.props = component.props?.filter((p) => p.id !== propId)
	})
