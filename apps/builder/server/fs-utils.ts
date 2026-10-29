import { randomBytes } from 'node:crypto'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { HttpError } from './errors'

const SAFE_ID = /^[a-z0-9-]+$/

export function isSafeId(id: unknown): id is string {
	return typeof id === 'string' && id.length <= 100 && SAFE_ID.test(id)
}

// Resolve a path under root and refuse anything that escapes it
export function resolveInside(root: string, ...parts: string[]): string {
	const base = path.resolve(root)
	const target = path.resolve(base, ...parts)
	if (target !== base && !target.startsWith(base + path.sep)) {
		throw new HttpError(400, 'Path escapes the project folder')
	}
	return target
}

// Write to a temp file next to the target, then rename over it
export async function writeAtomic(
	file: string,
	data: string | Uint8Array
): Promise<void> {
	await mkdir(path.dirname(file), { recursive: true })
	const tmp = `${file}.${randomBytes(4).toString('hex')}.tmp`
	await writeFile(tmp, data)
	await rename(tmp, file)
}

// Tabs and a trailing newline keep git diffs readable
export function writeJson(file: string, value: unknown): Promise<void> {
	return writeAtomic(file, JSON.stringify(value, null, '\t') + '\n')
}
