import {
	instancesOf,
	isElement,
	isOverridden,
	walk,
	type ElementNode,
} from '@ui-system/core'
import type { Doc } from '@/store/history'

// Instances of a component in every page and partial
export const instancesIn = (doc: Doc, id: string) => {
	const lists: ElementNode[][] = Object.values(doc.pages).map(
		(p) => p.sections
	)
	for (const partial of Object.values(doc.partials)) {
		if (partial) lists.push([partial])
	}
	return instancesOf(lists, id)
}

// Slots of an instance whose content differs from the master
export const overriddenIn = (instance: ElementNode, master: ElementNode) => {
	const found: ElementNode[] = []
	walk([instance], (node) => {
		if (isElement(node) && isOverridden(node, master)) found.push(node)
	})
	return found
}
