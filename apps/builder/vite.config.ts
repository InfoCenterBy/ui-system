import os from 'node:os'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// BUILDER_PORT lets several copies run side by side, the API sits one port above
const port = Number(process.env.BUILDER_PORT ?? 5180)
const api = `http://127.0.0.1:${port + 1}`

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
	test: {
		// Specs under e2e/ belong to Playwright
		exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
		// Never touch the real ~/.ui-builder/recent.json
		env: {
			BUILDER_RECENT_FILE: path.join(
				os.tmpdir(),
				'ui-builder-vitest-recent.json'
			),
		},
		// Tailwind and sharp work gets slow when many test workers share the CPU
		testTimeout: 30_000,
		hookTimeout: 30_000,
	},
	server: {
		port,
		// e2e runs ignore file edits, a hot reload would reset the open project
		...(process.env.BUILDER_E2E ? { watch: null, hmr: false } : {}),
		// A fallback port could land on the API port and make the proxy call itself
		strictPort: true,
		proxy: {
			'/api': api,
			'/assets': api,
		},
	},
})
