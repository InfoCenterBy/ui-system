import {
	classUsesToken,
	renameTokenInClasses,
	splitClasses,
	tokensIssue,
	walk,
	type DesignToken,
	type ElementNode,
	type TokenIssue,
} from '@ui-system/core'
import { useDocument } from '@/store/document'
import type { Doc } from '@/store/history'

export interface TokenUsage {
	pages: { id: string; name: string; count: number }[]
	partials: ('header' | 'footer')[]
	components: { id: string; name: string }[]
	// Elements that use the token, instances and masters counted alike
	total: number
}

// Every element list of the document with the place it belongs to
const places = (doc: Doc) => [
	...Object.values(doc.pages).map((page) => ({
		kind: 'page' as const,
		id: page.id,
		name: page.name,
		list: page.sections,
	})),
	...(['header', 'footer'] as const).flatMap((name) => {
		const root = doc.partials[name]
		return root ? [{ kind: name, id: name, name, list: [root] }] : []
	}),
	...Object.values(doc.components).map((c) => ({
		kind: 'component' as const,
		id: c.id,
		name: c.name,
		list: [c.root],
	})),
]

const countUses = (list: ElementNode[], token: DesignToken) => {
	let count = 0
	walk(list, (node) => {
		if (
			node.type === 'element' &&
			splitClasses(node.classes).some((raw) =>
				classUsesToken(raw, token.type, token.name)
			)
		) {
			count++
		}
	})
	return count
}

export const tokenUsage = (doc: Doc, token: DesignToken): TokenUsage => {
	const usage: TokenUsage = {
		pages: [],
		partials: [],
		components: [],
		total: 0,
	}
	for (const place of places(doc)) {
		const count = countUses(place.list, token)
		if (count === 0) continue
		usage.total += count
		if (place.kind === 'page') {
			usage.pages.push({ id: place.id, name: place.name, count })
		} else if (place.kind === 'component') {
			usage.components.push({ id: place.id, name: place.name })
		} else usage.partials.push(place.kind)
	}
	return usage
}

const tokensOf = () => useDocument.getState().doc?.site.tokens ?? []

// Problem with the list after a change, null when the change is fine
export const checkTokens = (next: DesignToken[]): TokenIssue | null =>
	tokensIssue(next)?.issue ?? null

export function addToken(token: DesignToken): TokenIssue | null {
	const next = [...tokensOf(), token]
	const issue = checkTokens(next)
	if (issue) return issue
	useDocument.getState().edit('Add token', (draft) => {
		draft.site.tokens = next
	})
	return null
}

export const setTokenValue = (name: string, value: string) =>
	useDocument.getState().edit(
		'Change token',
		(draft) => {
			const token = draft.site.tokens?.find((t) => t.name === name)
			if (token) token.value = value
		},
		{ mergeKey: `token:${name}` }
	)

// Renames the token and the classes that use it, one undo step
export function renameToken(from: string, to: string): TokenIssue | null {
	if (from === to) return null
	const tokens = tokensOf()
	const token = tokens.find((t) => t.name === from)
	if (!token) return null
	const issue = checkTokens(
		tokens.map((t) => (t === token ? { ...t, name: to } : t))
	)
	if (issue) return issue
	useDocument.getState().edit('Rename token', (draft) => {
		const target = draft.site.tokens?.find((t) => t.name === from)
		if (target) target.name = to
		const rename = (node: ElementNode) => {
			const classes = renameTokenInClasses(
				node.classes,
				token.type,
				from,
				to
			)
			if (classes !== node.classes) node.classes = classes
		}
		for (const place of places(draft)) {
			walk(place.list, (node) => {
				if (node.type === 'element') rename(node)
			})
		}
	})
	return null
}

// Classes that used the token stay in place, they just stop matching
export const deleteToken = (name: string) =>
	useDocument.getState().edit('Delete token', (draft) => {
		if (!draft.site.tokens) return
		draft.site.tokens = draft.site.tokens.filter((t) => t.name !== name)
		if (draft.site.tokens.length === 0) delete draft.site.tokens
	})
