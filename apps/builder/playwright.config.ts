import os from 'node:os'
import path from 'node:path'
import { defineConfig } from '@playwright/test'

// Own ports, so the builder on 5180/5181 stays untouched
const PORT = 5196
// E2E_REUSE=1 attaches to servers already running on these ports
const reuse = Boolean(process.env.E2E_REUSE)
const API_PORT = PORT + 1
// Recent projects of the e2e builder, never the real ~/.ui-builder
const RECENT_FILE = path.join(os.tmpdir(), 'ui-builder-e2e', 'recent.json')

export default defineConfig({
	testDir: './e2e',
	globalSetup: './e2e/global-setup.ts',
	outputDir: './test-results',
	reporter: [['list'], ['html', { open: 'never' }]],
	// Every test works on its own project, but one builder serves them all
	workers: 1,
	retries: 0,
	timeout: 60_000,
	expect: { timeout: 10_000 },
	use: {
		baseURL: `http://localhost:${PORT}`,
		channel: 'chrome',
		viewport: { width: 1600, height: 1000 },
		locale: 'en-US',
		trace: 'retain-on-failure',
	},
	webServer: [
		{
			command: 'pnpm exec tsx server/index.ts',
			url: `http://127.0.0.1:${API_PORT}/api/projects/recent`,
			env: {
				BUILDER_PORT: String(PORT),
				BUILDER_RECENT_FILE: RECENT_FILE,
			},
			reuseExistingServer: reuse,
		},
		{
			command: 'pnpm exec vite',
			url: `http://localhost:${PORT}`,
			env: { BUILDER_PORT: String(PORT), BUILDER_E2E: '1' },
			reuseExistingServer: reuse,
		},
	],
})
