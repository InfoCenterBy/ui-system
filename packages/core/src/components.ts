import { serializeHtml } from './html'
import type { IdFactory } from './ids'
import { isTextLike } from './text'
import { cloneNode, isElement, walk } from './tree'
import { applyClassDiff, variantOf, visibleHidden } from './variants'
import type {
	ClassDiff,
	Component,
	ComponentVariant,
	ElementNode,
	NodeId,
	SlotKind,
	TextNode,
	TreeNode,
} from './types'

// Components: a master tree plus materialized copies (instances) in pages.
// Every instance node points at its master node with ref

// What an instance may override on a slotted node
interface ContentSpec {
	attrs: string[]
	children: boolean
}

const specOf = (master: ElementNode): ContentSpec => {
	const tag = master.tag.toLowerCase()
	if (tag === 'img') return { attrs: ['src', 'alt'], children: false }
	if (tag === 'a') {
		return {
			attrs: ['href', 'target', 'rel'],
			children: isTextLike(master),
		}
	}
	return { attrs: [], children: true }
}

// Stable comparison key, ids and refs do not take part
const contentKey = (node: ElementNode, spec: ContentSpec) =>
	JSON.stringify([
		spec.attrs.map((name) => node.attrs[name] ?? null),
		spec.children ? serializeHtml(node.children, { pretty: false }) : null,
	])

// Plain copy that keeps ids, safe for Immer drafts
const copyNode = <T extends TreeNode>(node: T): T => {
	if (!isElement(node)) return { ...node }
	return {
		...node,
		attrs: { ...node.attrs },
		section: node.section && { ...node.section },
		instance: node.instance && { ...node.instance },
		children: node.children.map(copyNode),
	} as T
}

const indexByRef = (root: TreeNode | undefined) => {
	const map = new Map<NodeId, TreeNode>()
	if (root) {
		walk([root], (node) => {
			if (node.ref) map.set(node.ref, node)
		})
	}
	return map
}

const indexById = (root: ElementNode) => {
	const map = new Map<NodeId, TreeNode>()
	walk([root], (node) => {
		map.set(node.id, node)
	})
	return map
}

interface Context {
	newId: IdFactory
	componentId: string
	// Existing instance nodes by ref, their ids are reused
	previous?: Map<NodeId, TreeNode>
	// Master nodes the previous instance was built from
	oldMaster?: Map<NodeId, TreeNode>
	// Chosen variant and hidden master nodes of the instance
	variant?: ComponentVariant
	hidden?: Set<NodeId>
}

const autoSlot = (master: ElementNode): SlotKind | undefined => {
	const tag = master.tag.toLowerCase()
	if (tag === 'img') return 'image'
	if (tag === 'a') return 'link'
	return isTextLike(master) ? 'rich' : undefined
}

// Content below these slots belongs to the slot, nothing inside gets its own
const swallowsChildren = (master: ElementNode, slot: SlotKind | undefined) =>
	slot === 'rich' ||
	slot === 'text' ||
	(slot === 'link' && isTextLike(master))

const build = (
	master: TreeNode,
	ctx: Context,
	blocked: boolean,
	root?: { id: NodeId }
): TreeNode => {
	const before = ctx.previous?.get(master.id)
	if (master.type === 'text') {
		const text: TextNode = {
			id: before?.type === 'text' ? before.id : ctx.newId(),
			type: 'text',
			text: master.text,
			ref: master.id,
		}
		return text
	}
	const slot = master.slot ?? (blocked ? undefined : autoSlot(master))
	const prev = before?.type === 'element' ? before : undefined
	const node: ElementNode = {
		id: root?.id ?? prev?.id ?? ctx.newId(),
		type: 'element',
		tag: master.tag,
		classes: applyClassDiff(
			master.classes,
			ctx.variant?.diffs[master.id] as ClassDiff | undefined
		),
		attrs: { ...master.attrs },
		children: [],
		ref: master.id,
	}
	if (slot) node.slot = slot
	if (master.label) node.label = master.label
	if (root) {
		node.instance = { component: ctx.componentId }
		if (ctx.variant) node.instance.variant = ctx.variant.id
		if (ctx.hidden?.size) node.instance.hidden = [...ctx.hidden]
		if (master.section) node.section = { ...master.section, locked: true }
	}

	let keep = false
	if (prev && slot) {
		const spec = specOf(master)
		const was = ctx.oldMaster?.get(master.id)
		const base = was?.type === 'element' ? was : master
		if (contentKey(prev, spec) !== contentKey(base, spec)) {
			keep = true
			for (const name of spec.attrs) {
				if (name in prev.attrs) node.attrs[name] = prev.attrs[name]
				else delete node.attrs[name]
			}
			if (spec.children) node.children = prev.children.map(copyNode)
		}
	}
	if (!keep || !specOf(master).children) {
		const inner = blocked || swallowsChildren(master, slot)
		node.children = master.children
			.filter((child) => !ctx.hidden?.has(child.id))
			.map((child) => build(child, ctx, inner))
	}
	return node
}

// Builds an instance from the master. With the current instance given, node ids
// and overridden content survive. An override is content that differs from the
// old master, or from the new one when the old master is not known. The view
// picks a variant and the hidden master nodes
export const materialize = (
	master: ElementNode,
	componentId: string,
	newId: IdFactory,
	previous?: ElementNode,
	oldMaster?: ElementNode,
	view?: { variant?: ComponentVariant; hidden?: NodeId[] }
): ElementNode => {
	const ctx: Context = {
		newId,
		componentId,
		variant: view?.variant,
		hidden: view?.hidden && new Set(view.hidden),
		previous: previous && indexByRef(previous),
		oldMaster: oldMaster && indexById(oldMaster),
	}
	// The root is matched by position, not by ref
	if (previous && ctx.previous) ctx.previous.set(master.id, previous)
	return build(master, ctx, false, {
		id: previous?.id ?? newId(),
	}) as ElementNode
}

// The single place that turns master + variant + hidden nodes + the overrides
// kept in the previous instance into an instance tree. Canvas and export both
// read that tree. The view defaults to what the previous instance has chosen
export const resolveInstance = (
	component: Component,
	newId: IdFactory,
	previous?: ElementNode,
	oldMaster?: ElementNode,
	view: { variant?: string; hidden?: NodeId[] } = previous?.instance ?? {
		component: '',
	}
): ElementNode =>
	materialize(component.root, component.id, newId, previous, oldMaster, {
		variant: variantOf(component, view.variant),
		hidden: visibleHidden(component, view.hidden),
	})

export const masterNodeOf = (master: ElementNode, ref: NodeId | undefined) => {
	if (!ref) return null
	let found: TreeNode | null = null
	walk([master], (node) => {
		if (node.id === ref) {
			found = node
			return false
		}
	})
	return found as TreeNode | null
}

// True when the content of an instance node differs from its master node
export const isOverridden = (node: TreeNode, master: ElementNode) => {
	if (!isElement(node) || !node.slot) return false
	const source = masterNodeOf(master, node.ref)
	if (!isElement(source)) return false
	const spec = specOf(source)
	return contentKey(node, spec) !== contentKey(source, spec)
}

// Puts the content of the master node back
export const resetOverride = (
	node: ElementNode,
	master: ElementNode,
	newId: IdFactory,
	variant?: ComponentVariant
) => {
	const source = masterNodeOf(master, node.ref)
	if (!isElement(source)) return
	const spec = specOf(source)
	for (const name of spec.attrs) {
		if (name in source.attrs) node.attrs[name] = source.attrs[name]
		else delete node.attrs[name]
	}
	if (spec.children) {
		const ctx: Context = { newId, componentId: '', variant }
		node.children = source.children.map((child) => build(child, ctx, true))
	}
}

export const hasInstance = (node: TreeNode): boolean => {
	let found = false
	walk([node], (n) => {
		if (isElement(n) && n.instance) found = true
		return !found
	})
	return found
}

const stripMarkers = (node: TreeNode) => {
	delete (node as Partial<ElementNode>).instance
	delete node.ref
}

export const createComponent = (
	node: ElementNode,
	id: string,
	name: string,
	newId: IdFactory
): { component: Component; instance: ElementNode } => {
	if (hasInstance(node)) {
		throw new Error('A component cannot contain another component')
	}
	const root = cloneNode(node, newId)
	walk([root], (n) => {
		stripMarkers(n)
	})
	const component: Component = { id, name, root }
	// The page keeps the same root id so position and selection stay
	const instance = materialize(root, id, newId)
	instance.id = node.id
	return { component, instance }
}

// Plain tree again. With the master, slots, repeat and section come back as in
// the master, without it slots are dropped
export const detachInstance = (
	instance: ElementNode,
	master?: ElementNode
): ElementNode => {
	const detach = (node: TreeNode, isRoot: boolean): TreeNode => {
		if (!isElement(node)) {
			const copy = { ...node }
			delete copy.ref
			return copy
		}
		const { ref } = node
		const copy: ElementNode = {
			...node,
			attrs: { ...node.attrs },
			section: node.section && { ...node.section },
			children: node.children.map((child) => detach(child, false)),
		}
		delete copy.ref
		delete copy.instance
		const source = master ? masterNodeOf(master, ref) : null
		if (isElement(source)) {
			delete copy.slot
			delete copy.repeat
			delete copy.label
			delete copy.section
			if (source.slot) copy.slot = source.slot
			if (source.repeat) copy.repeat = source.repeat
			if (source.label) copy.label = source.label
			if (source.section) copy.section = { ...source.section }
		} else if (!master) {
			delete copy.slot
		}
		if (isRoot && copy.section) copy.section.locked = false
		return copy
	}
	return detach(instance, true) as ElementNode
}

export const instancesOf = (lists: TreeNode[][], componentId: string) => {
	const found: ElementNode[] = []
	for (const list of lists) {
		walk(list, (node) => {
			if (isElement(node) && node.instance?.component === componentId) {
				found.push(node)
				return false
			}
		})
	}
	return found
}

// Rebuilds every instance after the master changed, returns how many
export const syncInstances = (
	lists: TreeNode[][],
	component: Component,
	oldMaster: ElementNode,
	newId: IdFactory
) => {
	let count = 0
	const visit = (list: TreeNode[]) => {
		for (let i = 0; i < list.length; i++) {
			const node = list[i]
			if (!isElement(node)) continue
			if (node.instance?.component === component.id) {
				list[i] = resolveInstance(component, newId, node, oldMaster)
				count++
			} else visit(node.children)
		}
	}
	for (const list of lists) visit(list)
	return count
}
