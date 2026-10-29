import { __unstable__loadDesignSystem as loadDesignSystem } from 'tailwindcss'
import themeCss from 'tailwindcss/theme.css?raw'
import { DAISY_THEME_CSS } from '@ui-system/theme'
import {
	annotateCss,
	classesFromRules,
	colorOf,
	themeVars,
} from './classCompletion'

const variantNames = (variants) =>
	variants.flatMap((v) => [
		v.name,
		...v.values.map((value) => `${v.name}${v.hasDash ? '-' : ''}${value}`),
	])

// Every Tailwind utility and variant plus the component classes found in the given rules
export const loadClassIndex = async (rules = []) => {
	const design = await loadDesignSystem(
		`${themeCss}\n@tailwind utilities;\n${DAISY_THEME_CSS}`
	)
	const utilities = design.getClassList().map(([name]) => name)
	const components = classesFromRules(rules, new Set(utilities))
	const vars = themeVars(themeCss)
	const cssCache = new Map()

	const cssOf = (name) => {
		if (!cssCache.has(name)) {
			const css = components.has(name)
				? components.get(name)
				: design.candidatesToCss([name])[0]
			cssCache.set(name, css ? annotateCss(css.trim(), vars) : null)
		}
		return cssCache.get(name)
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
