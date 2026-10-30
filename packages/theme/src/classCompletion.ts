// Splits the class being typed into its variant prefix and the class itself
export const classToken = (valueBeforeCursor: string) => {
	const word = /[^\s"']*$/.exec(valueBeforeCursor)?.[0] ?? ''
	let depth = 0
	let split = 0
	for (let i = 0; i < word.length; i++) {
		const char = word[i]
		if (char === '[' || char === '(') depth++
		else if (char === ']' || char === ')') depth = Math.max(0, depth - 1)
		else if (char === ':' && depth === 0) split = i + 1
	}
	return { prefix: word.slice(0, split), base: word.slice(split) }
}

// Custom properties declared in a stylesheet
export const themeVars = (css: string): Record<string, string> =>
	Object.fromEntries(
		[...css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(([, k, v]) => [
			k,
			v.trim(),
		])
	)

// Replaces var() references the map knows, the rest stay as they are
export const resolveVars = (value: string, vars: Record<string, string>) => {
	let result = value
	for (let i = 0; i < 4; i++) {
		const next = result.replace(
			/var\((--[\w-]+)\)/g,
			(match, name) => vars[name] ?? match
		)
		if (next === result) break
		result = next
	}
	return result
}

const COLOR_PROPERTY =
	/(?:^|[\s;{])(?:color|background-color|border(?:-[a-z]+)*-color|outline-color|text-decoration-color|fill|stroke|accent-color|caret-color|--tw-(?:ring|shadow|inset-ring|inset-shadow|gradient-from|gradient-via|gradient-to)-color|--tw-gradient-(?:from|via|to))\s*:\s*([^;}]+)/

// Color a class paints with, for the swatch next to it
export const colorOf = (
	css: string | null | undefined,
	vars: Record<string, string> = {}
) => {
	const value = COLOR_PROPERTY.exec(css ?? '')?.[1]?.trim()
	if (!value || /^(inherit|currentcolor|initial|unset)$/i.test(value)) {
		return null
	}
	return resolveVars(value, vars)
}

const CLASS_IN_SELECTOR = /\.((?:[\w-]|\\.)+)/g

// Component classes from the site stylesheet that Tailwind itself does not know
export interface StyleRule {
	selector: string
	css: string
}

// Selector list split on commas outside of (), [] and strings
export const splitSelectorList = (selector: string) => {
	const parts: string[] = []
	let depth = 0
	let quote = ''
	let start = 0
	for (let i = 0; i < selector.length; i++) {
		const char = selector[i]
		if (char === '\\') i++
		else if (quote) {
			if (char === quote) quote = ''
		} else if (char === '"' || char === "'") quote = char
		else if (char === '(' || char === '[') depth++
		else if (char === ')' || char === ']') depth = Math.max(0, depth - 1)
		else if (char === ',' && depth === 0) {
			parts.push(selector.slice(start, i))
			start = i + 1
		}
	}
	parts.push(selector.slice(start))
	return parts.map((part) => part.trim()).filter(Boolean)
}

const MAX_RELATED_RULES = 4
const MAX_RELATED_DECLARATIONS = 20

const declarationsOf = (css: string) =>
	css
		.split(';')
		.map((d) => d.trim())
		.filter(Boolean)

const block = (selector: string, list: string[]) =>
	`${selector} {\n${list.map((d) => `  ${d};`).join('\n')}\n}`

interface Related {
	parts: string[]
	declarations: string[]
}

// Previews as plain lists of rule blocks: the class's own rule, or when it has
// none, the few shortest rules that mention it
export const classesFromRules = (
	rules: StyleRule[],
	known: ReadonlySet<string>
): Map<string, string | null> => {
	const own = new Map<string, string[]>()
	const related = new Map<string, Related[]>()
	for (const { selector, css } of rules) {
		const declarations = declarationsOf(css)
		const mentioned = new Map<string, string[]>()
		for (const part of splitSelectorList(selector)) {
			// Responsive copies like .sm\:btn repeat the plain rule
			if (/\\:/.test(part)) continue
			for (const [, raw] of part.matchAll(CLASS_IN_SELECTOR)) {
				const name = raw.replace(/\\(.)/g, '$1')
				if (known.has(name) || /[:/[(]|^\d/.test(name)) continue
				if (!own.has(name)) own.set(name, [])
				// Only rules for the bare class describe what it does
				if (part === `.${raw}`) own.get(name)?.push(...declarations)
				const parts = mentioned.get(name) ?? []
				if (!parts.includes(part)) parts.push(part)
				mentioned.set(name, parts)
			}
		}
		if (!declarations.length) continue
		for (const [name, parts] of mentioned) {
			if (!related.has(name)) related.set(name, [])
			related.get(name)?.push({ parts, declarations })
		}
	}
	return new Map(
		[...own].map(([name, list]): [string, string | null] => {
			const unique = [...new Set(list)]
			if (unique.length) return [name, block(`.${name}`, unique)]
			const seen = new Set<string>()
			const picked = (related.get(name) ?? [])
				.map((rule) => ({ ...rule, selector: rule.parts.join(', ') }))
				.filter((rule) => {
					const key = `${rule.selector}|${rule.declarations.join(';')}`
					return !seen.has(key) && !!seen.add(key)
				})
				.sort((a, b) => a.selector.length - b.selector.length)
				.slice(0, MAX_RELATED_RULES)
			let left = MAX_RELATED_DECLARATIONS
			const blocks: string[] = []
			for (const rule of picked) {
				if (left <= 0) break
				const list = rule.declarations.slice(0, left)
				left -= list.length
				blocks.push(block(rule.selector, list))
			}
			return [name, blocks.length ? blocks.join('\n\n') : null]
		})
	)
}

// Tailwind output with resolved theme values noted at the end of each line
export const annotateCss = (css: string, vars: Record<string, string>) =>
	css
		.split('\n')
		.map((line) => {
			if (!line.includes('var(')) return line
			const resolved = resolveVars(line, vars)
			return resolved === line
				? line
				: `${line} /* ${resolved.split(':').slice(1).join(':').replace(/;\s*$/, '').trim()} */`
		})
		.join('\n')
