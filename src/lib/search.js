const KIND_ORDER = { page: 0, category: 1, variant: 2 }
const LIMIT = 50

const words = (text) =>
	text
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean)

// Every class name used in an HTML snippet
export const classesOf = (html) =>
	new Set(
		[...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((m) =>
			m[1].split(/\s+/).filter(Boolean)
		)
	)

// Damerau-Levenshtein distance, stops early once over the limit
const distance = (a, b, limit) => {
	if (Math.abs(a.length - b.length) > limit) return limit + 1
	const rows = Array.from({ length: a.length + 1 }, (_, i) => [i])
	for (let j = 1; j <= b.length; j++) rows[0][j] = j
	for (let i = 1; i <= a.length; i++) {
		let rowMin = Infinity
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1
			rows[i][j] = Math.min(
				rows[i - 1][j] + 1,
				rows[i][j - 1] + 1,
				rows[i - 1][j - 1] + cost
			)
			if (
				i > 1 &&
				j > 1 &&
				a[i - 1] === b[j - 2] &&
				a[i - 2] === b[j - 1]
			) {
				rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1)
			}
			rowMin = Math.min(rowMin, rows[i][j])
		}
		if (rowMin > limit) return limit + 1
	}
	return rows[a.length][b.length]
}

const isSubsequence = (token, word) => {
	let i = 0
	for (const char of word) if (char === token[i]) i++
	return i === token.length
}

// Score of one query token against the item text, 0 means no match
const textScore = (token, item) => {
	if (item.text.includes(token)) {
		return item.words.some((w) => w.startsWith(token)) ? 5 : 4
	}
	if (token.length >= 3 && item.words.some((w) => isSubsequence(token, w))) {
		return 2
	}
	if (token.length >= 4) {
		const limit = token.length >= 7 ? 2 : 1
		const close = item.words.some(
			(w) =>
				distance(token, w, limit) <= limit ||
				distance(token, w.slice(0, token.length), limit) <= limit
		)
		if (close) return 1
	}
	return 0
}

const classScore = (token, item) => {
	if (!item.classes) return 0
	if (item.classes.has(token)) return 6
	if (token.includes('-')) {
		for (const cls of item.classes) if (cls.startsWith(token)) return 3
	}
	return 0
}

export const buildIndex = ({ pages, categories, groupName }) =>
	[
		...pages.map((page) => ({
			id: page.path,
			kind: 'page',
			label: page.name,
			hint: 'Page',
			to: page.path,
		})),
		...categories.map((category) => ({
			id: category.slug,
			kind: 'category',
			label: category.name,
			hint: groupName(category.group),
			to: `/components/${category.slug}`,
		})),
		...categories.flatMap((category) =>
			category.variants.map((variant) => ({
				id: `${category.slug}/${variant.name}`,
				kind: 'variant',
				label: `${category.name} / ${variant.title}`,
				hint: 'Variant',
				to: `/components/${category.slug}?v=${variant.name}`,
				classes: classesOf(variant.html),
			}))
		),
	].map((item) => ({
		...item,
		text: item.label.toLowerCase(),
		words: words(`${item.label} ${item.id}`),
	}))

// Fuzzy search by name, typos and class names like btn-soft
export const search = (index, query) => {
	const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (tokens.length === 0) {
		return index
			.filter((item) => item.kind !== 'variant')
			.sort(
				(a, b) =>
					KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
					(a.kind === 'page' ? 0 : a.label.localeCompare(b.label))
			)
	}

	const results = []
	for (const item of index) {
		let score = 0
		let classMatch = null
		for (const token of tokens) {
			const byText = textScore(token, item)
			const byClass = classScore(token, item)
			if (!byText && !byClass) {
				score = 0
				break
			}
			if (!byText) classMatch = token
			score += Math.max(byText, byClass)
		}
		if (score > 0) {
			results.push(
				classMatch
					? { ...item, score, hint: `uses .${classMatch}` }
					: { ...item, score }
			)
		}
	}
	return results
		.sort(
			(a, b) =>
				b.score - a.score ||
				KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
				a.label.localeCompare(b.label)
		)
		.slice(0, LIMIT)
}
