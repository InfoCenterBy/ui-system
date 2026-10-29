import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { HttpError } from './errors'
import { writeAtomic } from './fs-utils'

export const MAX_UPLOAD = 20 * 1024 * 1024

const ALLOWED = new Set([
	'png',
	'jpg',
	'jpeg',
	'webp',
	'gif',
	'svg',
	'avif',
	'woff',
	'woff2',
	'ttf',
	'otf',
])

function slugify(name: string): string {
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
	return slug || 'file'
}

// Saves an upload into dir and returns the final file name
export async function saveUpload(dir: string, file: File): Promise<string> {
	const ext = path.extname(file.name).slice(1).toLowerCase()
	if (!ALLOWED.has(ext)) throw new HttpError(415, 'File type is not allowed')
	if (file.size > MAX_UPLOAD) throw new HttpError(413, 'File is over 20 MB')
	const base = slugify(path.basename(file.name, path.extname(file.name)))
	const taken = new Set(await readdir(dir).catch(() => []))
	let name = `${base}.${ext}`
	for (let n = 2; taken.has(name); n++) name = `${base}-${n}.${ext}`
	await writeAtomic(
		path.join(dir, name),
		new Uint8Array(await file.arrayBuffer())
	)
	return name
}

export interface AssetInfo {
	path: string
	name: string
	size: number
	kind: 'image' | 'font'
}

const FONT_EXT = new Set(['woff', 'woff2', 'ttf', 'otf'])

// Files of the assets folder, images first, newest first within a kind
export async function listAssets(dir: string): Promise<AssetInfo[]> {
	const names = await readdir(dir).catch(() => [])
	const items: (AssetInfo & { mtime: number })[] = []
	for (const name of names) {
		const ext = path.extname(name).slice(1).toLowerCase()
		if (!ALLOWED.has(ext)) continue
		const info = await stat(path.join(dir, name)).catch(() => null)
		if (!info?.isFile()) continue
		items.push({
			path: `assets/${name}`,
			name,
			size: info.size,
			kind: FONT_EXT.has(ext) ? 'font' : 'image',
			mtime: info.mtimeMs,
		})
	}
	items.sort(
		(a, b) =>
			Number(a.kind === 'font') - Number(b.kind === 'font') ||
			b.mtime - a.mtime
	)
	return items.map((item) => ({
		path: item.path,
		name: item.name,
		size: item.size,
		kind: item.kind,
	}))
}
