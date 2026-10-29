import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
	server: {
		port: 5180,
		// Falling back to 5181 would make the proxy call itself
		strictPort: true,
		proxy: {
			'/api': 'http://127.0.0.1:5181',
			'/assets': 'http://127.0.0.1:5181',
		},
	},
})
