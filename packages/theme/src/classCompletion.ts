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

export const classesFromRules = (
	rules: StyleRule[],
	known: ReadonlySet<string>
): Map<string, string | null> => {
	const declarations = new Map<string, string[]>()
	for (const { selector, css } of rules) {
		for (const [, raw] of selector.matchAll(CLASS_IN_SELECTOR)) {
			const name = raw.replace(/\\(.)/g, '$1')
			if (known.has(name) || /[:/[(]|^\d/.test(name)) continue
			if (!declarations.has(name)) declarations.set(name, [])
			// Only rules for the bare class describe what it does
			if (selector.trim() === `.${raw}`) {
				declarations
					.get(name)
					?.push(...css.split(';').map((d) => d.trim()))
			}
		}
	}
	return new Map(
		[...declarations].map(([name, list]): [string, string | null] => {
			const unique = [...new Set(list.filter(Boolean))]
			const css = unique.map((d) => `  ${d};`).join('\n')
			return [name, unique.length ? `.${name} {\n${css}\n}` : null]
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
