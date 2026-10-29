import { copyFile, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
	collectClasses,
	isElement,
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

interface PageDocument {
	site: Site
	page: Page
	body: string
	prefix: string
	script: boolean
}

export const pageDocument = ({
	site,
	page,
	body,
	prefix,
	script,
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
		'<body>',
		indent(body),
		'</body>',
		'</html>',
		'',
	].join('\n')
}

const pageRoots = (project: Project, page: Page): ElementNode[] => {
	const { header, footer } = project.partials
	return structuredClone([
		...(page.showHeader && header ? [header] : []),
		...page.sections,
		...(page.showFooter && footer ? [footer] : []),
	])
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

	const classes = new Set<string>()
	const scripts: string[] = []
	const exported: string[] = []

	for (const id of site.pages) {
		const page = project.pages.find((p) => p.id === id)
		if (!page) {
			warnings.push(`Page ${id} is listed in site.json but missing`)
			continue
		}
		const roots = pageRoots(project, page)
		const pageScripts = takeScripts(roots)
		scripts.push(...pageScripts)
		collectClasses(roots, classes)

		// The first section is above the fold, its images load right away
		const firstSection = page.sections[0]?.id
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
			body: serializeHtml(roots),
			prefix,
			script: pageScripts.length > 0,
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

	return {
		dir: dist,
		pages: exported,
		files,
		cssBytes: Buffer.byteLength(css),
		script,
		warnings,
	}
}
