import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { FontChoice, FontFile } from '@ui-system/core'
import type { Hono } from 'hono'
import { saveUpload } from './assets'
import { HttpError } from './errors'
import { writeAtomic, writeJson } from './fs-utils'

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

export interface GoogleFace {
	subset: string
	style: 'normal' | 'italic'
	weight: number
	url: string
	unicodeRange?: string
}

export interface FontSuggestion {
	family: string
	category: string
	weights: number[]
}

const KEEP_SUBSETS = new Set(['latin', 'cyrillic'])
const FONT_EXT = new Set(['woff2', 'woff', 'ttf', 'otf'])
// A desktop Chrome UA makes Google answer with woff2 files
const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const FAMILY = /^[A-Za-z0-9][A-Za-z0-9 ]{0,59}$/
const OFFLINE =
	'Could not reach Google Fonts. Check your internet connection or import the font files manually.'

export const slug = (name: string) =>
	name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'font'

// Reads the @font-face blocks of a Google css2 response, the comment before each names its subset
export function parseGoogleCss(css: string): GoogleFace[] {
	const faces: GoogleFace[] = []
	const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g
	for (const m of css.matchAll(re)) {
		const subset = m[1]
		const block = m[2]
		if (!KEEP_SUBSETS.has(subset)) continue
		const url = /url\(\s*['"]?([^)'"]+)['"]?\s*\)/.exec(block)?.[1]
		if (!url) continue
		const weight = Number(/font-weight:\s*(\d+)/.exec(block)?.[1] ?? 400)
		const italic = /font-style:\s*italic/.test(block)
		const unicodeRange = /unicode-range:\s*([^;]+);/.exec(block)?.[1]
		faces.push({
			subset,
			style: italic ? 'italic' : 'normal',
			weight,
			url,
			unicodeRange: unicodeRange?.trim(),
		})
	}
	return faces
}

export function googleCssUrl(
	family: string,
	weights: number[],
	italic: boolean
) {
	const sorted = [...new Set(weights)].sort((a, b) => a - b)
	const name = family.trim().replace(/ /g, '+')
	const pairs = [0, 1].flatMap((i) => sorted.map((w) => `${i},${w}`))
	const axis = italic
		? `ital,wght@${pairs.join(';')}`
		: `wght@${sorted.join(';')}`
	return `https://fonts.googleapis.com/css2?family=${name}:${axis}&display=swap`
}

async function download(fetchFn: FetchFn, url: string): Promise<Uint8Array> {
	if (!/^https:\/\/fonts\.gstatic\.com\//.test(url)) {
		throw new HttpError(502, 'Unexpected font file location')
	}
	let res: Response
	try {
		res = await fetchFn(url)
	} catch {
		throw new HttpError(502, OFFLINE)
	}
	if (!res.ok) {
		throw new HttpError(502, `Font download failed (${res.status})`)
	}
	return new Uint8Array(await res.arrayBuffer())
}

// The index keeps imported families listed even when no role uses them
const indexFile = (assetsDir: string) =>
	path.join(assetsDir, 'fonts', 'fonts.json')

export async function readFontIndex(assetsDir: string): Promise<FontChoice[]> {
	try {
		const data: unknown = JSON.parse(
			await readFile(indexFile(assetsDir), 'utf8')
		)
		return Array.isArray(data) ? (data as FontChoice[]) : []
	} catch {
		return []
	}
}

async function updateIndex(
	assetsDir: string,
	family: string,
	files: FontFile[],
	replace: boolean
): Promise<FontChoice> {
	const list = await readFontIndex(assetsDir)
	const at = list.findIndex((f) => f.family === family)
	if (at === -1) list.push({ family, files })
	else if (replace) list[at] = { family, files }
	else {
		const known = new Set(list[at].files.map((f) => f.file))
		list[at].files.push(...files.filter((f) => !known.has(f.file)))
	}
	await writeJson(indexFile(assetsDir), list)
	return list.find((f) => f.family === family) ?? { family, files }
}

export async function importGoogleFont(
	assetsDir: string,
	fetchFn: FetchFn,
	input: { family: string; weights: number[]; italic: boolean }
): Promise<FontChoice> {
	const family = input.family.trim()
	if (!FAMILY.test(family)) throw new HttpError(400, 'Invalid font family')
	const weights = input.weights.filter(
		(w) => Number.isInteger(w) && w >= 100 && w <= 900
	)
	if (weights.length === 0) {
		throw new HttpError(400, 'Pick at least one weight')
	}

	let res: Response
	try {
		res = await fetchFn(googleCssUrl(family, weights, input.italic), {
			headers: { 'User-Agent': USER_AGENT },
		})
	} catch {
		throw new HttpError(502, OFFLINE)
	}
	if (res.status === 400 || res.status === 404) {
		throw new HttpError(
			404,
			`Google Fonts has no family "${family}" with these weights`
		)
	}
	if (!res.ok) throw new HttpError(502, `Google Fonts answered ${res.status}`)

	const faces = parseGoogleCss(await res.text())
	if (faces.length === 0) {
		throw new HttpError(502, 'Google Fonts sent no latin or cyrillic files')
	}
	const files: FontFile[] = []
	for (const face of faces) {
		const italic = face.style === 'italic' ? '-italic' : ''
		const name = `${slug(family)}-${face.weight}${italic}-${face.subset}.woff2`
		await writeAtomic(
			path.join(assetsDir, 'fonts', name),
			await download(fetchFn, face.url)
		)
		files.push({
			weight: face.weight,
			style: face.style,
			file: `assets/fonts/${name}`,
			...(face.unicodeRange && { unicodeRange: face.unicodeRange }),
		})
	}
	return updateIndex(assetsDir, family, files, true)
}

export function parseMetadata(text: string): FontSuggestion[] {
	// The endpoint starts with an anti-hijacking line before the JSON
	const data = JSON.parse(text.slice(text.indexOf('{'))) as {
		familyMetadataList?: {
			family?: string
			category?: string
			fonts?: Record<string, unknown>
		}[]
	}
	const list = data.familyMetadataList
	if (!Array.isArray(list)) return []
	return list.flatMap((f) => {
		if (typeof f.family !== 'string') return []
		const weights = [
			...new Set(Object.keys(f.fonts ?? {}).map((k) => parseInt(k, 10))),
		]
			.filter((w) => w > 0)
			.sort((a, b) => a - b)
		return [{ family: f.family, category: f.category ?? '', weights }]
	})
}

export function searchFonts(list: FontSuggestion[], q: string) {
	const query = q.trim().toLowerCase()
	if (!query) return list.slice(0, 20)
	const lower = (f: FontSuggestion) => f.family.toLowerCase()
	const starts = list.filter((f) => lower(f).startsWith(query))
	const contains = list.filter(
		(f) => !lower(f).startsWith(query) && lower(f).includes(query)
	)
	return [...starts, ...contains].slice(0, 20)
}

export function registerFontRoutes(
	app: Hono,
	assetsDir: () => string,
	fetchFn: FetchFn
) {
	// Cached after the first success, a failure is retried on the next search
	let metadata: Promise<FontSuggestion[]> | null = null
	const loadMetadata = () => {
		metadata ??= (async () => {
			try {
				const res = await fetchFn(
					'https://fonts.google.com/metadata/fonts'
				)
				if (!res.ok) throw new Error(String(res.status))
				return parseMetadata(await res.text())
			} catch {
				metadata = null
				return []
			}
		})()
		return metadata
	}

	app.get('/api/fonts/google/search', async (c) =>
		c.json(searchFonts(await loadMetadata(), c.req.query('q') ?? ''))
	)

	app.post('/api/project/fonts/google', async (c) => {
		const data = (await c.req.json().catch(() => null)) as {
			family?: unknown
			weights?: unknown
			italic?: unknown
		} | null
		if (
			typeof data?.family !== 'string' ||
			!Array.isArray(data.weights) ||
			!data.weights.every((w) => typeof w === 'number')
		) {
			throw new HttpError(400, 'family and weights are required')
		}
		const choice = await importGoogleFont(assetsDir(), fetchFn, {
			family: data.family,
			weights: data.weights as number[],
			italic: data.italic === true,
		})
		return c.json(choice)
	})

	app.get('/api/project/fonts', async (c) =>
		c.json(await readFontIndex(assetsDir()))
	)

	app.post('/api/project/fonts/local', async (c) => {
		const dir = assetsDir()
		const form = await c.req.parseBody({ all: true }).catch(() => {
			throw new HttpError(400, 'Body must be multipart form data')
		})
		const family = typeof form.family === 'string' ? form.family.trim() : ''
		if (!FAMILY.test(family))
			throw new HttpError(400, 'Invalid font family')
		const weight = Number(form.weight)
		if (!Number.isInteger(weight) || weight < 100 || weight > 900) {
			throw new HttpError(400, 'Weight must be between 100 and 900')
		}
		const style = form.style === 'italic' ? 'italic' : 'normal'
		const raw = form.files ?? form.file
		const uploads = (Array.isArray(raw) ? raw : [raw]).filter(
			(f): f is File => f instanceof File
		)
		if (uploads.length === 0) throw new HttpError(400, 'No files sent')
		for (const f of uploads) {
			const ext = path.extname(f.name).slice(1).toLowerCase()
			if (!FONT_EXT.has(ext)) {
				throw new HttpError(415, 'Only woff2, woff, ttf and otf files')
			}
		}
		const files: FontFile[] = []
		for (const f of uploads) {
			const name = await saveUpload(path.join(dir, 'fonts'), f)
			files.push({ weight, style, file: `assets/fonts/${name}` })
		}
		// The whole family comes back so a role can use all its faces
		return c.json(await updateIndex(dir, family, files, false))
	})
}
