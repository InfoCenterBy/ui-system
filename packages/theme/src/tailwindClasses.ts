import { __unstable__loadDesignSystem as loadDesignSystem } from 'tailwindcss'
import themeCss from 'tailwindcss/theme.css?raw'
import {
	annotateCss,
	classesFromRules,
	colorOf,
	themeVars,
	type StyleRule,
} from './classCompletion'
import { DAISY_THEME_CSS } from './tailwindTheme'

export interface ClassIndex {
	utilities: string[]
	components: string[]
	variants: string[]
	cssOf: (name: string) => string | null
	colorOf: (name: string) => string | null
}

interface VariantEntry {
	name: string
	values: string[]
	hasDash: boolean
}

const variantNames = (variants: VariantEntry[]) =>
	variants.flatMap((v) => [
		v.name,
		...v.values.map((value) => `${v.name}${v.hasDash ? '-' : ''}${value}`),
	])

// Every Tailwind utility and variant plus the component classes found in the given rules
export const loadClassIndex = async (
	rules: StyleRule[] = []
): Promise<ClassIndex> => {
	const design = await loadDesignSystem(
		`${themeCss}\n@tailwind utilities;\n${DAISY_THEME_CSS}`
	)
	const utilities = design.getClassList().map(([name]) => name)
	const components = classesFromRules(rules, new Set(utilities))
	const vars = themeVars(themeCss)
	const cssCache = new Map<string, string | null>()

	const cssOf = (name: string) => {
		if (!cssCache.has(name)) {
			const css = components.has(name)
				? components.get(name)
				: design.candidatesToCss([name])[0]
			cssCache.set(name, css ? annotateCss(css.trim(), vars) : null)
		}
		return cssCache.get(name) ?? null
	}

	return {
		utilities,
		components: [...components.keys()].sort(),
		variants: [...new Set(variantNames(design.getVariants()))],
		cssOf,
		colorOf: (name) =>
			components.has(name)
				? null
				: colorOf(design.candidatesToCss([name])[0], vars),
	}
}
