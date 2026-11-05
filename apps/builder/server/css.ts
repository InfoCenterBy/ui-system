import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '@tailwindcss/node'
import { tokensCss, type DesignToken } from '@ui-system/core'
import { HttpError } from './errors'
import { fontCss, type SiteFonts } from './fontCss'

export { fontCss }

export interface SiteTheme {
	name: string
	vars: Record<string, string>
}

type Compiler = Awaited<ReturnType<typeof compile>>

// tailwindcss and daisyui resolve from the builder package
const BASE = path.dirname(fileURLToPath(import.meta.url))
const THEME_NAME = /^[a-z][a-z0-9-]*$/
const VAR_NAME = /^--[a-z0-9-]+$/i

const source = (theme: string, tokens: readonly DesignToken[]) =>
	`@import "tailwindcss";\n@plugin "daisyui" { themes: ${theme} --default; }\n${tokensCss(tokens)}`

const createCompiler = (theme: string, tokens: readonly DesignToken[]) =>
	compile(source(theme, tokens), { base: BASE, onDependency: () => {} })

// Theme generator values go on top of the preset they started from
const themeOverrides = (vars: Record<string, string>) => {
	const lines = Object.entries(vars)
		.filter(([name, value]) => VAR_NAME.test(name) && !/[;{}]/.test(value))
		.map(([name, value]) => `\t${name}: ${value};`)
	return lines.length ? `\n:root {\n${lines.join('\n')}\n}\n` : ''
}

const checkTheme = (theme: SiteTheme) => {
	if (!THEME_NAME.test(theme.name)) {
		throw new HttpError(400, `Unknown theme name "${theme.name}"`)
	}
}

const MAX_COMPILERS = 6

// The canvas reuses one compiler per theme and token set, it only ever adds classes
export class CssBuilder {
	private compilers = new Map<string, Promise<Compiler>>()

	async build(
		classes: Iterable<string>,
		theme: SiteTheme,
		fonts?: SiteFonts,
		tokens: readonly DesignToken[] = []
	) {
		checkTheme(theme)
		const key = `${theme.name}\n${tokensCss(tokens)}`
		let compiler = this.compilers.get(key)
		if (!compiler) {
			// Token edits make many keys, the oldest compiler goes
			if (this.compilers.size >= MAX_COMPILERS) {
				this.compilers.delete(this.compilers.keys().next().value!)
			}
			compiler = createCompiler(theme.name, tokens)
			this.compilers.set(key, compiler)
		}
		const css = (await compiler).build([...classes])
		return css + themeOverrides(theme.vars) + fontCss(fonts, '')
	}
}

// Export CSS holds exactly the classes of the site, nothing left from editing
export const buildExportCss = async (
	classes: Iterable<string>,
	theme: SiteTheme,
	fonts?: SiteFonts,
	prefix = '',
	tokens: readonly DesignToken[] = []
) => {
	checkTheme(theme)
	const compiler = await createCompiler(theme.name, tokens)
	return (
		compiler.build([...classes]) +
		themeOverrides(theme.vars) +
		fontCss(fonts, prefix)
	)
}
