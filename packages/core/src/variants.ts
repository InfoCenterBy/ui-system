import { groupOf, parseClass, splitClasses } from './classes'
import { isTextLike } from './text'
import { isElement } from './tree'
import type {
	ClassDiff,
	Component,
	ComponentVariant,
	ElementNode,
	NodeId,
	PropKind,
	TreeNode,
} from './types'

// Variants store only what differs from the base classes of a master node, so
// later edits of the base still reach a variant wherever it did not override

// Tokens that override each other: same breakpoint and state, same utility group
const slotOf = (token: string) => {
	const { variants, utility } = parseClass(token)
	const group = groupOf(utility)
	return group ? `${variants.join(':')}|${group}` : null
}

export const isEmptyDiff = (diff: ClassDiff | undefined) =>
	!diff || (diff.add.length === 0 && diff.remove.length === 0)

// The difference that turns the base classes into the target classes
export const diffClasses = (base: string, target: string): ClassDiff => {
	const from = splitClasses(base)
	const to = splitClasses(target)
	return {
		add: [...new Set(to.filter((token) => !from.includes(token)))],
		remove: [...new Set(from.filter((token) => !to.includes(token)))],
	}
}

// Base classes with the diff on top. An added token also pushes out base
// tokens of its own utility group, so a changed base value cannot fight it
export const applyClassDiff = (base: string, diff: ClassDiff | undefined) => {
	if (isEmptyDiff(diff)) return base
	const { add, remove } = diff as ClassDiff
	const replaced = new Set(add.map(slotOf).filter((s) => s !== null))
	const kept = splitClasses(base).filter((token) => {
		if (remove.includes(token) || add.includes(token)) return false
		const slot = slotOf(token)
		return slot === null || !replaced.has(slot)
	})
	return [...kept, ...add].join(' ')
}

export const variantOf = (
	component: Pick<Component, 'variants'>,
	id: string | undefined
) => (id ? component.variants?.find((v) => v.id === id) : undefined)

// A copy of the tree with the variant applied, node ids stay the same
export const applyVariant = (
	master: ElementNode,
	variant: ComponentVariant | undefined
): ElementNode => {
	if (!variant) return master
	const visit = (node: TreeNode): TreeNode => {
		if (!isElement(node)) return node
		const diff = variant.diffs[node.id]
		return {
			...node,
			classes: applyClassDiff(node.classes, diff),
			children: node.children.map(visit),
		}
	}
	return visit(master) as ElementNode
}

// Kinds of property a master node can expose, the root cannot be hidden
export const propKindsFor = (node: ElementNode, isRoot = false): PropKind[] => {
	const tag = node.tag.toLowerCase()
	const kinds: PropKind[] = []
	if (tag === 'img') kinds.push('image')
	else if (tag === 'a') {
		kinds.push('link')
		if (isTextLike(node)) kinds.push('text')
	} else if (isTextLike(node)) kinds.push('text')
	if (!isRoot) kinds.push('visibility')
	return kinds
}

// Hidden ids that still have a visibility property, in the order given
export const visibleHidden = (
	component: Pick<Component, 'props'>,
	hidden: NodeId[] | undefined
) => {
	const allowed = new Set(
		(component.props ?? [])
			.filter((p) => p.kind === 'visibility')
			.map((p) => p.node)
	)
	return (hidden ?? []).filter((id) => allowed.has(id))
}
