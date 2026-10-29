import type { FontChoice } from '@ui-system/core'

export interface SiteFonts {
	heading: FontChoice | null
	body: FontChoice | null
}

const FORMATS: Record<string, string> = {
	woff2: 'woff2',
	woff: 'woff',
	ttf: 'truetype',
	otf: 'opentype',
}

const FALLBACK =
	'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

// Keeps user input from closing a string or a rule
const clean = (value: string) => value.replace(/["\;{}\r\n]/g, '')

const quote = (family: string) => `"${clean(family)}"`

function faces(choice: FontChoice, prefix: string, seen: Set<string>) {
	const rules: string[] = []
	for (const f of choice.files) {
		const key = `${f.file}|${f.unicodeRange ?? ''}`
		if (seen.has(key)) continue
		seen.add(key)
		const ext = f.file.split('.').pop()?.toLowerCase() ?? ''
		const format = FORMATS[ext]
		const src = `url("${encodeURI(prefix + f.file).replace(/"/g, '')}")`
		const lines = [
			`\tfont-family: ${quote(choice.family)};`,
			`\tfont-style: ${f.style === 'italic' ? 'italic' : 'normal'};`,
			`\tfont-weight: ${Number(f.weight) || 400};`,
			'\tfont-display: swap;',
			`\tsrc: ${src}${format ? ` format("${format}")` : ''};`,
		]
		if (f.unicodeRange) {
			lines.push(`\tunicode-range: ${clean(f.unicodeRange)};`)
		}
		rules.push(`@font-face {\n${lines.join('\n')}\n}`)
	}
	return rules
}

// Only the @font-face rules, for samples of fonts no role uses yet
export function faceCss(choices: FontChoice[], prefix = ''): string {
	const seen = new Set<string>()
	const rules = choices.flatMap((choice) => faces(choice, prefix, seen))
	return rules.length ? `\n${rules.join('\n')}\n` : ''
}

// @font-face rules plus the rules that apply them, prefix goes before each file path
export function fontCss(fonts: SiteFonts | undefined, prefix = ''): string {
	if (!fonts) return ''
	const { heading, body } = fonts
	const seen = new Set<string>()
	const out: string[] = []
	for (const choice of [heading, body]) {
		if (choice) out.push(...faces(choice, prefix, seen))
	}
	if (body) {
		out.push(
			`:root {\n\t--font-sans: ${quote(body.family)}, ${FALLBACK};\n}`,
			'html {\n\tfont-family: var(--font-sans);\n}'
		)
	}
	if (heading) {
		out.push(
			`:root {\n\t--font-heading: ${quote(heading.family)}, ${FALLBACK};\n}`,
			'h1, h2, h3, h4, h5, h6, .font-heading {\n\tfont-family: var(--font-heading);\n}'
		)
	}
	return out.length ? `\n${out.join('\n')}\n` : ''
}

const isChoice = (v: unknown): v is FontChoice => {
	const c = v as FontChoice | null
	return (
		typeof c?.family === 'string' &&
		Array.isArray(c.files) &&
		c.files.every(
			(f) => typeof f?.file === 'string' && typeof f.weight === 'number'
		)
	)
}

// Request bodies are untrusted, anything malformed counts as no fonts
export function toSiteFonts(v: unknown): SiteFonts | undefined {
	const fonts = v as Partial<SiteFonts> | null
	if (typeof fonts !== 'object' || fonts === null) return undefined
	return {
		heading: isChoice(fonts.heading) ? fonts.heading : null,
		body: isChoice(fonts.body) ? fonts.body : null,
	}
}

export const toChoices = (v: unknown): FontChoice[] =>
	Array.isArray(v) ? v.filter(isChoice) : []
