import { isElement, walk } from './tree'
import type { ElementNode, TreeNode } from './types'

// Buttons and images never send a value of their own
const NOT_FIELD = ['submit', 'button', 'reset', 'image']

export const FIELD_TYPES = [
	'text',
	'email',
	'tel',
	'number',
	'url',
	'password',
	'date',
	'checkbox',
	'radio',
	'file',
	'hidden',
]

export const inputType = (node: ElementNode) =>
	(node.attrs.type ?? 'text').toLowerCase()

// A control whose value goes to the form handler under its name
export const isFormField = (node: ElementNode) => {
	const tag = node.tag.toLowerCase()
	if (tag === 'select' || tag === 'textarea') return true
	return tag === 'input' && !NOT_FIELD.includes(inputType(node))
}

export const isSubmitControl = (node: ElementNode) => {
	const tag = node.tag.toLowerCase()
	const type = (
		node.attrs.type ?? (tag === 'button' ? 'submit' : '')
	).toLowerCase()
	return (tag === 'button' || tag === 'input') && type === 'submit'
}

const BY_TYPE: Record<string, string> = {
	email: 'email',
	tel: 'phone',
	password: 'password',
	url: 'url',
	number: 'number',
	date: 'date',
	file: 'file',
	checkbox: 'agree',
	radio: 'choice',
	range: 'range',
	hidden: 'hidden',
}

// Latin lowercase words joined by underscores, empty when nothing Latin is left
export const slugName = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.split('_')
		.slice(0, 3)
		.join('_')
		.slice(0, 30)

const textOf = (nodes: TreeNode[]): string =>
	nodes
		.map((n) =>
			n.type === 'text'
				? n.text
				: isFormField(n)
					? ''
					: textOf(n.children)
		)
		.join(' ')

// Readable name for a field: the type, or the label, placeholder, aria-label
export const suggestFieldName = (node: ElementNode, label = '') => {
	const tag = node.tag.toLowerCase()
	const type = tag === 'input' ? inputType(node) : tag
	const typed = BY_TYPE[type]
	if (typed) return typed
	const named =
		slugName(label) ||
		slugName(node.attrs.placeholder ?? '') ||
		slugName(node.attrs['aria-label'] ?? '')
	if (named) return named
	return tag === 'textarea' ? 'message' : tag === 'select' ? 'choice' : 'text'
}

// base, base_2, base_3 and so on
export const uniqueName = (base: string, used: Set<string>) => {
	let name = base
	for (let n = 2; used.has(name); n++) name = `${base}_${n}`
	return name
}

// Fresh trees only. Fields without a name are not sent, so they get one.
// Checkboxes and radios are named only inside a form, elsewhere they are toggles
export const assignFieldNames = (
	nodes: TreeNode[],
	used: Iterable<string> = []
) => {
	const taken = new Set(used)
	walk(nodes, (node) => {
		if (isElement(node) && node.attrs.name) taken.add(node.attrs.name)
	})
	const radios = new Map<ElementNode | null, string>()
	const assign = (
		list: TreeNode[],
		form: ElementNode | null,
		label: string
	) => {
		for (const node of list) {
			if (!isElement(node)) continue
			const tag = node.tag.toLowerCase()
			const here = tag === 'form' ? node : form
			const text = tag === 'label' ? textOf(node.children).trim() : label
			if (isFormField(node) && !node.attrs.name) {
				const toggle = ['checkbox', 'radio'].includes(inputType(node))
				if (!toggle || here) {
					if (inputType(node) === 'radio' && radios.has(here)) {
						node.attrs.name = radios.get(here)!
					} else {
						const name = uniqueName(
							suggestFieldName(node, text),
							taken
						)
						taken.add(name)
						node.attrs.name = name
						if (inputType(node) === 'radio') radios.set(here, name)
					}
				}
			}
			assign(
				node.children,
				here,
				tag === 'label' ? text : isFormField(node) ? '' : label
			)
		}
	}
	assign(nodes, null, '')
}
