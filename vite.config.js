import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
	base: '/ui-system/',
	plugins: [react(), tailwindcss()],
	// Raw Tailwind theme CSS feeds the class autocomplete tests
	test: { css: { include: [/tailwindcss\/theme\.css/] } },
})
