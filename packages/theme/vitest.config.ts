import { defineConfig } from 'vitest/config'

export default defineConfig({
	// Raw Tailwind theme CSS feeds the class index tests
	test: { css: { include: [/tailwindcss\/theme\.css/] } },
})
