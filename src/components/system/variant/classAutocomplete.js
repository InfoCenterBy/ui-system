import { autocompletion } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { htmlLanguage } from '@codemirror/lang-html'
import { classToken } from '../../../lib/classCompletion'

// Rules of the site stylesheet, daisyUI component classes come from here
const siteRules = () => {
	const rules = []
	const walk = (list) => {
		for (const rule of list) {
			if (rule.selectorText) {
				rules.push({
					selector: rule.selectorText,
					css: rule.style.cssText,
				})
			}
			if (rule.cssRules) walk(rule.cssRules)
		}
	}
	for (const sheet of document.styleSheets) {
		const node = sheet.ownerNode
		if (!node?.matches('link[rel="stylesheet"], style[data-vite-dev-id]')) {
			continue
		}
		try {
			walk(sheet.cssRules)
		} catch {
			// Cross-origin sheets cannot be read
		}
	}
	return rules
}

const renderInfo = (css) => {
	const pre = document.createElement('pre')
	pre.className = 'cm-classInfo'
	pre.textContent = css
	return pre
}

let index = null
let indexPromise = null

// Tailwind loads on first use and is kept for every editor on the page
export const preloadClassIndex = () => {
	indexPromise ??= import('../../../lib/tailwindClasses')
		.then(({ loadClassIndex }) => loadClassIndex(siteRules()))
		.then((loaded) => {
			const info = (completion) => {
				const css = loaded.cssOf(completion.label)
				return css ? renderInfo(css) : null
			}
			const option = (label, extra) => ({ label, info, ...extra })
			loaded.options = [
				...loaded.components.map((label) =>
					option(label, {
						type: 'class',
						detail: 'daisyUI',
						boost: 1,
					})
				),
				...loaded.utilities.map((label) =>
					option(label, { type: 'class' })
				),
				...loaded.variants.map((name) => ({
					label: `${name}:`,
					type: 'keyword',
					detail: 'variant',
					boost: -1,
				})),
			]
			index = loaded
			return loaded
		})
	return indexPromise
}

// Text of a class attribute value up to the cursor, null outside of one
const classValueBefore = (context) => {
	let node = syntaxTree(context.state).resolveInner(context.pos, -1)
	for (let i = 0; node && i < 3 && node.name !== 'AttributeValue'; i++) {
		node = node.parent
	}
	if (node?.name !== 'AttributeValue') return null
	const name = node.parent?.getChild('AttributeName')
	if (!name || context.state.sliceDoc(name.from, name.to) !== 'class') {
		return null
	}
	const text = context.state.sliceDoc(node.from, node.to)
	const quote = /^["']/.test(text) ? text[0] : ''
	const closed = quote && text.length > 1 && text.endsWith(quote)
	const start = node.from + quote.length
	if (context.pos < start || (closed && context.pos >= node.to)) return null
	return context.state.sliceDoc(start, context.pos)
}

const classSource = async (context) => {
	const value = classValueBefore(context)
	if (value === null) return null
	const { base } = classToken(value)
	if (!base && !context.explicit) return null
	const loaded = await preloadClassIndex()
	return {
		from: context.pos - base.length,
		options: loaded.options,
		validFor: /^[^\s"':]*$/,
	}
}

// Color swatch in front of utilities that paint with a color
const swatch = {
	position: 20,
	render: (completion) => {
		if (completion.type !== 'class' || !index) return null
		const color = index.colorOf(completion.label)
		if (!color) return null
		const dot = document.createElement('span')
		dot.className = 'cm-classSwatch'
		dot.style.background = color
		return dot
	},
}

export const classAutocomplete = [
	htmlLanguage.data.of({ autocomplete: classSource }),
	autocompletion({
		addToOptions: [swatch],
		// Equal matches read in numeric order, red-50 before red-100
		compareCompletions: (a, b) =>
			a.label.localeCompare(b.label, 'en', { numeric: true }),
	}),
]
