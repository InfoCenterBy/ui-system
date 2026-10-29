import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
	server: {
		port: 5180,
		proxy: {
			'/api': 'http://localhost:5181',
			'/assets': 'http://localhost:5181',
		},
	},
})
