import {
	copyFile,
	mkdir,
	readFile,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
	BODY_CLASSES,
	HEADER_CLASSES,
	MAIN_CLASSES,
	collectClasses,
	isElement,
	resolveLayout,
	serializeHtml,
	walk,
	type ElementNode,
	type Page,
	type Site,
	type TreeNode,
} from '@ui-system/core'
import { buildExportCss } from './css'
import { resolveInside } from './fs-utils'
import type { OptimizedImage } from './images'
import type { Project } from './project'
import { detectFeatures, featureScripts } from './siteScripts'

export type Optimize = (
	input: string,
	outDir: string,
	baseName: string
) => Promise<OptimizedImage | null>

export interface ExportResult {
	dir: string
	pages: string[]
	files: number
	cssBytes: number
	script: boolean
	cally: boolean
	warnings: string[]
}

const ASSET = /^assets\//
const URL_ATTRS = ['src', 'href', 'poster', 'data-src']
// Images up to this width are the default src, wider ones only come through srcset
const DEFAULT_WIDTH = 1440

// Tailwind max-width steps in px, they cap how wide an image can be shown
const MAX_WIDTHS: Record<string, number> = {
	xs: 320,
	sm: 384,
	md: 448,
	lg: 512,
	xl: 576,
	'2xl': 672,
	'3xl': 768,
	'4xl': 896,
	'5xl': 1024,
	'6xl': 1152,
	'7xl': 1280,
}

// The browser picks a smaller file when the image cannot get wider than its max-w class
export const sizesFor = (classes: string) => {
	const caps = classes
		.split(/\s+/)
		.map((name) => /^max-w-(.+)$/.exec(name)?.[1])
		.map((step) => (step ? MAX_WIDTHS[step] : undefined))
		.filter((px): px is number => px !== undefined)
	if (caps.length === 0) return '100vw'
	const cap = Math.min(...caps)
	return `(max-width: ${cap}px) 100vw, ${cap}px`
}

const escapeText = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const escapeAttr = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export const normalizePrefix = (prefix: string) => {
	const value = prefix.trim()
	return value && !value.endsWith('/') ? `${value}/` : value
}

const slugOf = (file: string) =>
	file
		.replace(ASSET, '')
		.replace(/\.[^.]+$/, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'image'

// Inline scripts leave the markup and go to site.js, the page then loads it
export const takeScripts = (roots: TreeNode[]) => {
	const scripts: string[] = []
	const strip = (list: TreeNode[]) => {
		for (let i = list.length - 1; i >= 0; i--) {
			const node = list[i]
			if (!isElement(node)) continue
			if (node.tag.toLowerCase() === 'script' && !node.attrs.src) {
				const code = node.children
					.map((child) => (child.type === 'text' ? child.text : ''))
					.join('')
					.trim()
				if (code) scripts.unshift(code)
				list.splice(i, 1)
			} else {
				strip(node.children)
			}
		}
	}
	strip(roots)
	return scripts
}

export const siteScript = (scripts: string[]) =>
	[...new Set(scripts)].map((code) => `;(() => {\n${code}\n})()\n`).join('\n')

// Copies Cally with its MIT notice on top, as a classic script so file:// pages work too
const writeCally = async (to: string) => {
	const entry = fileURLToPath(import.meta.resolve('cally'))
	const license = await readFile(
		path.join(path.dirname(entry), '..', 'LICENSE'),
		'utf8'
	)
	// The module ends with an export list, a classic script has none
	const code = (await readFile(entry, 'utf8')).replace(
		/\nexport \{[^}]*\};?\s*$/,
		''
	)
	const notice = license.trim().replace(/\*\//g, '* /')
	await mkdir(path.dirname(to), { recursive: true })
	await writeFile(
		to,
		`/*! Cally, MIT license\n${notice}\n*/\n;(() => {\n${code}\n})()\n`
	)
}

interface PageDocument {
	site: Site
	page: Page
	body: string
	bodyClass?: string
	prefix: string
	script: boolean
	cally?: boolean
}

// Local copy of the Cally web component, loaded only by pages with a calendar
export const CALLY_FILE = 'assets/js/cally.js'

export const pageDocument = ({
	site,
	page,
	body,
	bodyClass,
	prefix,
	script,
	cally,
}: PageDocument) => {
	const { title, description, ogImage } = page.meta
	const head = [
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		`<title>${escapeText(title || page.name)}</title>`,
		description &&
			`<meta name="description" content="${escapeAttr(description)}">`,
		`<meta property="og:title" content="${escapeAttr(title || page.name)}">`,
		description &&
			`<meta property="og:description" content="${escapeAttr(description)}">`,
		ogImage &&
			`<meta property="og:image" content="${escapeAttr(ASSET.test(ogImage) ? prefix + ogImage : ogImage)}">`,
		`<link rel="stylesheet" href="${prefix}assets/site.css">`,
		script && `<script src="${prefix}assets/site.js" defer></script>`,
		cally && `<script src="${prefix}${CALLY_FILE}" defer></script>`,
	].filter(Boolean)
	const indent = (text: string) =>
		text
			.split('\n')
			.map((line) => (line ? `\t${line}` : line))
			.join('\n')
	return [
		'<!doctype html>',
		`<html lang="${escapeAttr(site.lang || 'ru')}">`,
		'<head>',
		indent(head.join('\n')),
		'</head>',
		bodyClass ? `<body class="${escapeAttr(bodyClass)}">` : '<body>',
		indent(body),
		'</body>',
		'</html>',
		'',
	].join('\n')
}

interface PageParts {
	header: ElementNode | null
	sections: ElementNode[]
	footer: ElementNode | null
}

// Header position classes go on a copy, the stored partial stays as it is
const pageParts = (project: Project, page: Page): PageParts => {
	const { header, footer } = project.partials
	const position = resolveLayout(project.site.layout).header
	const parts = structuredClone({
		header: page.showHeader ? header : null,
		sections: page.sections,
		footer: page.showFooter ? footer : null,
	})
	if (parts.header && position !== 'static') {
		parts.header.classes = [parts.header.classes, HEADER_CLASSES[position]]
			.filter(Boolean)
			.join(' ')
		if (position === 'autohide')
			parts.header.attrs['data-header'] = position
	}
	return parts
}

const indentLines = (text: string) =>
	text
		.split('\n')
		.map((line) => (line ? `\t${line}` : line))
		.join('\n')

// Header, main and footer in body order, main grows when the footer sticks
const pageBody = (parts: PageParts, stickyFooter: boolean) => {
	const html = (list: ElementNode[]) => serializeHtml(list).trimEnd()
	return [
		parts.header && html([parts.header]),
		`<main${stickyFooter ? ` class="${MAIN_CLASSES}"` : ''}>`,
		indentLines(html(parts.sections)),
		'</main>',
		parts.footer && html([parts.footer]),
	]
		.filter((part) => part !== null && part !== '')
		.join('\n')
}

// Writes dist/: one HTML file per page, assets/site.css, site.js when needed and used assets
export async function exportSite(
	project: Project,
	optimize: Optimize
): Promise<ExportResult> {
	const { site } = project
	const prefix = normalizePrefix(site.pathPrefix)
	const dist = resolveInside(project.path, 'dist')
	const assetsOut = path.join(dist, 'assets')
	await rm(dist, { recursive: true, force: true, maxRetries: 5 })
	await mkdir(assetsOut, { recursive: true })

	const warnings: string[] = []
	const copied = new Map<string, boolean>()
	const images = new Map<string, OptimizedImage | null>()
	let files = 0

	// Copies a project asset once, false when it is missing
	const copyAsset = async (file: string) => {
		if (copied.has(file)) return copied.get(file)!
		const from = resolveInside(project.path, file)
		const to = resolveInside(dist, file)
		let ok = true
		try {
			await stat(from)
			await mkdir(path.dirname(to), { recursive: true })
			await copyFile(from, to)
			files++
		} catch {
			ok = false
			warnings.push(`Missing file ${file}`)
		}
		copied.set(file, ok)
		return ok
	}

	const optimized = async (file: string) => {
		if (!images.has(file)) {
			let result: OptimizedImage | null = null
			const from = resolveInside(project.path, file)
			try {
				await stat(from)
			} catch {
				// Missing files are reported once by copyAsset
				images.set(file, null)
				return null
			}
			try {
				result = await optimize(
					from,
					path.join(assetsOut, 'img'),
					slugOf(file)
				)
				if (result) files += result.variants.length
			} catch {
				warnings.push(`Could not process image ${file}`)
			}
			images.set(file, result)
		}
		return images.get(file)!
	}

	const rewriteImage = async (node: ElementNode, eager: boolean) => {
		const src = node.attrs.src
		const image = await optimized(src)
		if (!image) {
			if (await copyAsset(src)) node.attrs.src = prefix + src
			return
		}
		const url = (file: string) => `${prefix}assets/img/${file}`
		const fallback =
			image.variants.findLast((v) => v.width <= DEFAULT_WIDTH) ??
			image.variants[0]
		node.attrs.src = url(fallback.file)
		node.attrs.srcset = image.variants
			.map((v) => `${url(v.file)} ${v.width}w`)
			.join(', ')
		node.attrs.sizes ??= sizesFor(node.classes)
		node.attrs.width ??= String(image.width)
		node.attrs.height ??= String(image.height)
		if (!eager) node.attrs.loading ??= 'lazy'
		node.attrs.decoding ??= 'async'
	}

	const { stickyFooter } = resolveLayout(site.layout)
	const classes = new Set<string>()
	const scripts: string[] = []
	const exported: string[] = []
	let cally = false

	for (const id of site.pages) {
		const page = project.pages.find((p) => p.id === id)
		if (!page) {
			warnings.push(`Page ${id} is listed in site.json but missing`)
			continue
		}
		const parts = pageParts(project, page)
		const roots = [
			...(parts.header ? [parts.header] : []),
			...parts.sections,
			...(parts.footer ? [parts.footer] : []),
		]
		const pageScripts = takeScripts(roots)
		const features = detectFeatures(roots)
		pageScripts.push(...featureScripts(features))
		cally ||= features.calendar
		scripts.push(...pageScripts)
		collectClasses(roots, classes)
		if (stickyFooter) {
			for (const name of `${BODY_CLASSES} ${MAIN_CLASSES}`.split(' ')) {
				classes.add(name)
			}
		}

		// The first section is above the fold, its images load right away
		const firstSection = parts.sections[0]?.id
		const jobs: Promise<unknown>[] = []
		walk(roots, (node) => {
			if (!isElement(node)) return
			const eager = Boolean(firstSection && node.id === firstSection)
			const visit = (el: ElementNode, inFirst: boolean) => {
				for (const name of URL_ATTRS) {
					const value = el.attrs[name]
					if (!value || !ASSET.test(value)) continue
					if (el.tag.toLowerCase() === 'img' && name === 'src') {
						jobs.push(rewriteImage(el, inFirst))
					} else {
						jobs.push(
							copyAsset(value).then((ok) => {
								if (ok) el.attrs[name] = prefix + value
							})
						)
					}
				}
				for (const child of el.children) {
					if (isElement(child)) visit(child, inFirst)
				}
			}
			visit(node, eager)
			return false
		})
		await Promise.all(jobs)
		if (page.meta.ogImage && ASSET.test(page.meta.ogImage)) {
			await copyAsset(page.meta.ogImage)
		}

		const html = pageDocument({
			site,
			page,
			body: pageBody(parts, stickyFooter),
			bodyClass: stickyFooter ? BODY_CLASSES : '',
			prefix,
			script: pageScripts.length > 0,
			cally: features.calendar,
		})
		const name = `${page.slug}.html`
		await writeFile(path.join(dist, name), html)
		exported.push(name)
		files++
	}

	// Fonts sit next to site.css, relative urls work without a prefix
	const fontFiles = [site.fonts.heading, site.fonts.body]
		.flatMap((choice) => choice?.files ?? [])
		.map((f) => f.file)
	for (const file of new Set(fontFiles)) await copyAsset(file)
	const css = await buildExportCss(
		classes,
		site.theme,
		site.fonts,
		prefix || '../'
	)
	await writeFile(path.join(assetsOut, 'site.css'), css)
	files++

	const script = scripts.length > 0
	if (script) {
		await writeFile(path.join(assetsOut, 'site.js'), siteScript(scripts))
		files++
	}

	if (cally) {
		await writeCally(path.join(dist, CALLY_FILE))
		files++
	}

	return {
		dir: dist,
		pages: exported,
		files,
		cssBytes: Buffer.byteLength(css),
		script,
		cally,
		warnings,
	}
}
