import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { writeJson } from './fs-utils'

export interface RecentProject {
	path: string
	name: string
	openedAt: string
}

const MAX_RECENT = 10

// BUILDER_RECENT_FILE keeps tests and e2e runs away from the real home folder
export function defaultRecentFile(): string {
	return (
		process.env.BUILDER_RECENT_FILE ??
		path.join(os.homedir(), '.ui-builder', 'recent.json')
	)
}

export async function readRecent(file: string): Promise<RecentProject[]> {
	try {
		const list: unknown = JSON.parse(await readFile(file, 'utf8'))
		return Array.isArray(list) ? (list as RecentProject[]) : []
	} catch {
		return []
	}
}

export async function addRecent(
	file: string,
	entry: { path: string; name: string }
): Promise<void> {
	const rest = (await readRecent(file)).filter((r) => r.path !== entry.path)
	const next = [{ ...entry, openedAt: new Date().toISOString() }, ...rest]
	await writeJson(file, next.slice(0, MAX_RECENT))
}
