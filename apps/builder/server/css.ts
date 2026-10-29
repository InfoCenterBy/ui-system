import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '@tailwindcss/node'
import { HttpError } from './errors'

export interface SiteTheme {
	name: string
	vars: Record<string, string>
}

type Compiler = Awaited<ReturnType<typeof compile>>

// tailwindcss and daisyui resolve from the builder package
const BASE = path.dirname(fileURLToPath(import.meta.url))
const THEME_NAME = /^[a-z][a-z0-9-]*$/
const VAR_NAME = /^--[a-z0-9-]+$/i

const source = (theme: string) =>
	`@import "tailwindcss";\n@plugin "daisyui" { themes: ${theme} --default; }\n`

const createCompiler = (theme: string) =>
	compile(source(theme), { base: BASE, onDependency: () => {} })

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

// The canvas reuses one compiler per theme, it only ever adds classes
export class CssBuilder {
	private compilers = new Map<string, Promise<Compiler>>()

	async build(classes: Iterable<string>, theme: SiteTheme) {
		checkTheme(theme)
		let compiler = this.compilers.get(theme.name)
		if (!compiler) {
			compiler = createCompiler(theme.name)
			this.compilers.set(theme.name, compiler)
		}
		const css = (await compiler).build([...classes])
		return css + themeOverrides(theme.vars)
	}
}

// Export CSS holds exactly the classes of the site, nothing left from editing
export const buildExportCss = async (
	classes: Iterable<string>,
	theme: SiteTheme
) => {
	checkTheme(theme)
	const compiler = await createCompiler(theme.name)
	return compiler.build([...classes]) + themeOverrides(theme.vars)
}
