import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import type { Hono } from 'hono'
import { classesFromRules, type StyleRule } from '@ui-system/theme'

export interface ComponentClass {
	name: string
	css: string
}

// Style rules of a stylesheet, at-rules like @layer and @media are looked into
export function parseRules(css: string): StyleRule[] {
	const rules: StyleRule[] = []
	const text = css.replace(/\/\*[\s\S]*?\*\//g, '')

	// Index of the brace closing the one at `open`, strings and url() are skipped
	const close = (open: number) => {
		let depth = 0
		for (let i = open; i < text.length; i++) {
			const char = text[i]
			if (char === '"' || char === "'") {
				i = text.indexOf(char, i + 1)
				if (i < 0) return text.length
			} else if (char === '{') depth++
			else if (char === '}' && --depth === 0) return i
		}
		return text.length
	}

	const walk = (from: number, to: number) => {
		let i = from
		while (i < to) {
			const open = text.indexOf('{', i)
			if (open < 0 || open >= to) return
			const semi = text.lastIndexOf(';', open)
			const head = text.slice(Math.max(i, semi + 1), open).trim()
			const end = Math.min(close(open), to)
			if (head.startsWith('@')) {
				if (/^@(layer|media|supports|container)\b/.test(head)) {
					walk(open + 1, end)
				}
			} else if (head) {
				rules.push({
					selector: head,
					css: ownDeclarations(text.slice(open + 1, end)),
				})
			}
			i = end + 1
		}
	}
	walk(0, text.length)
	return rules
}

// Declarations of a rule body without nested rules
function ownDeclarations(body: string) {
	let depth = 0
	let own = ''
	for (const char of body) {
		if (char === '{') depth++
		else if (char === '}') depth--
		else if (depth === 0) own += char
	}
	// A declaration cut off by a nested rule has no value worth keeping
	return own
		.split(';')
		.map((d) => d.trim())
		.filter((d) => /^[-\w]+\s*:/.test(d))
		.map((d) => d.replace(/^([-\w]+)\s*:\s*/, '$1: '))
		.join('; ')
}

// daisyUI component classes with their CSS
export function componentClasses(css: string): ComponentClass[] {
	const found = classesFromRules(parseRules(css), new Set())
	return [...found]
		.map(([name, rule]) => ({ name, css: rule ?? '' }))
		.sort((a, b) => a.name.localeCompare(b.name))
}

let cache: Promise<ComponentClass[]> | null = null

async function loadComponents() {
	const require = createRequire(import.meta.url)
	const file = require.resolve('daisyui/daisyui.css')
	return componentClasses(await readFile(file, 'utf8'))
}

export function registerClassRoutes(app: Hono) {
	app.get('/api/classes/components', async (c) => {
		cache ??= loadComponents().catch((error: unknown) => {
			cache = null
			throw error
		})
		return c.json(await cache)
	})
}
