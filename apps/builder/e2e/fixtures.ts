import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test as base, expect, type Page } from '@playwright/test'

const API = 'http://127.0.0.1:5197'

interface Fixtures {
	// Folder of a fresh project made through the API
	project: { dir: string; name: string }
	// The editor of that project, opened from the start screen
	editor: Page
}

export const test = base.extend<Fixtures>({
	page: async ({ page }, use) => {
		// English UI whatever the machine language is
		await page.addInitScript(() =>
			localStorage.setItem('builder.lang', 'en')
		)
		await use(page)
	},
	project: async ({ request }, use) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'ui-builder-e2e-'))
		const dir = path.join(root, 'site')
		const name = 'E2E Site'
		const res = await request.post(`${API}/api/projects/create`, {
			data: { path: dir, name, lang: 'en' },
		})
		expect(res.ok()).toBe(true)
		await use({ dir, name })
		await rm(root, { recursive: true, force: true, maxRetries: 10 })
	},
	editor: async ({ page, project }, use) => {
		await page.goto('/')
		await page.getByLabel('Project folder path').fill(project.dir)
		await page.getByRole('button', { name: 'Open', exact: true }).click()
		await expect(page.locator('iframe[title="Page canvas"]')).toBeVisible()
		await use(page)
	},
})

export { expect }

// Canvas of the page, an iframe with srcdoc (section previews are iframes too)
export const canvas = (page: Page) =>
	page.frameLocator('iframe[title="Page canvas"]')

// Adds the first section found by a name and waits until it is on the canvas
export async function addSection(page: Page, search: string) {
	await page.getByRole('tab', { name: 'Sections' }).click()
	await page.getByRole('searchbox', { name: 'Search sections' }).fill(search)
	await page.getByRole('button', { name: /^Add / }).first().click()
	await expect(canvas(page).locator('section')).toBeVisible()
}

// Adds an empty (unlocked) block and one element from the Elements tab
export async function addElement(page: Page, search: string, variant: string) {
	await page.getByRole('tab', { name: 'Elements' }).click()
	await page.getByRole('button', { name: 'Add empty block' }).click()
	await page.getByRole('searchbox').fill(search)
	await page
		.getByRole('button', { name: `Add ${variant}`, exact: true })
		.click()
}
