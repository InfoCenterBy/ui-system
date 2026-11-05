import { mkdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// Same file as webServer env in playwright.config.ts
const E2E_DIR = path.join(os.tmpdir(), 'ui-builder-e2e')
const REAL_RECENT = path.join(os.homedir(), '.ui-builder', 'recent.json')

const read = (file: string) => readFile(file, 'utf8').catch(() => null)

export default async function globalSetup() {
	// The webServer is already up, so only the old list is dropped
	await rm(path.join(E2E_DIR, 'recent.json'), { force: true })
	await mkdir(E2E_DIR, { recursive: true })
	// The user may use the real builder meanwhile, so only e2e projects count
	return async () => {
		const text = (await read(REAL_RECENT)) ?? ''
		if (text.includes('ui-builder-e2e-')) {
			throw new Error(`e2e projects leaked into ${REAL_RECENT}`)
		}
	}
}
