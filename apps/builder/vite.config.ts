import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// BUILDER_PORT lets several copies run side by side, the API sits one port above
const port = Number(process.env.BUILDER_PORT ?? 5180)
const api = `http://127.0.0.1:${port + 1}`

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
	server: {
		port,
		// A fallback port could land on the API port and make the proxy call itself
		strictPort: true,
		proxy: {
			'/api': api,
			'/assets': api,
		},
	},
})
