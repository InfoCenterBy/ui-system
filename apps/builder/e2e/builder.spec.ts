import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { addElement, addSection, canvas, expect, test } from './fixtures'

// 1x1 transparent PNG
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
	'base64'
)

test.describe('project', () => {
	test('creates a project from the start screen', async ({
		page,
		project,
	}) => {
		const dir = path.join(path.dirname(project.dir), 'made-in-ui')
		await page.goto('/')
		await page.getByLabel('Project folder path').fill(dir)
		await page.getByRole('button', { name: 'Create', exact: true }).click()
		await page.getByLabel('Site name').fill('Made in UI')
		await page.getByRole('button', { name: 'Create', exact: true }).click()
		await expect(canvas(page).locator('#page')).toBeAttached()
		await expect(page.getByText('Made in UI')).toBeVisible()
		const site = JSON.parse(
			await readFile(path.join(dir, 'site.json'), 'utf8')
		)
		expect(site.name).toBe('Made in UI')
	})

	test('opens an existing project from the folder path and the recent list', async ({
		page,
		project,
	}) => {
		await page.goto('/')
		// The API made the project, so it is in the e2e recent file only
		await expect(page.getByText(project.dir)).toBeVisible()
		await page.getByRole('button', { name: project.dir }).click()
		await expect(canvas(page).locator('#page')).toBeAttached()
		await expect(page.getByText(project.name)).toBeVisible()
	})
})

test.describe('editing', () => {
	test('inserts a section and edits its text on the canvas', async ({
		editor: page,
	}) => {
		await addSection(page, 'hero')
		const title = canvas(page).locator('h1')
		await expect(title).toHaveText('Build pages from ready sections')
		await title.dblclick()
		await page.keyboard.press('Control+A')
		await page.keyboard.type('Edited by e2e')
		await page.keyboard.press('Escape')
		await expect(title).toHaveText('Edited by e2e')
		await expect(page.getByText('Saved', { exact: true })).toBeVisible()
	})

	test('inserts an element and changes its Options', async ({
		editor: page,
	}) => {
		await addElement(page, 'button', 'Default')
		const button = canvas(page).locator('button.btn')
		await button.click()
		const options = page.locator('section').filter({
			has: page.getByRole('heading', { name: 'Options', exact: true }),
		})
		await options.getByLabel('Color').selectOption('btn-secondary')
		await expect(button).toHaveClass(/btn-secondary/)
		await options.getByLabel('Size').selectOption('btn-lg')
		await expect(button).toHaveClass(/btn-lg/)
		await options.getByLabel('Color').selectOption('')
		await expect(button).not.toHaveClass(/btn-secondary/)
	})

	test('adds a carousel slide', async ({ editor: page }) => {
		await addElement(page, 'carousel', 'Snap start')
		const slides = canvas(page).locator('.carousel-item')
		await expect(slides).toHaveCount(5)
		await canvas(page).locator('.carousel').click()
		await expect(
			page.getByRole('heading', { name: 'Slides (5)' })
		).toBeVisible()
		const chooser = page.waitForEvent('filechooser')
		await page.getByRole('button', { name: 'Add photos' }).click()
		await (
			await chooser
		).setFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: PNG })
		await expect(
			page.getByRole('heading', { name: 'Slides (6)' })
		).toBeVisible()
		await expect(slides).toHaveCount(6)
	})

	test('sets a hover style and puts the class on the element', async ({
		editor: page,
	}) => {
		await addElement(page, 'button', 'Default')
		const button = canvas(page).locator('button.btn')
		await button.click()
		await page
			.getByRole('group', { name: 'State' })
			.getByRole('button', { name: 'Hover', exact: true })
			.click()
		await page.getByRole('button', { name: 'Flex', exact: true }).click()
		await expect(button).toHaveClass(/(^|\s)hover:flex(\s|$)/)
		// The normal state stays untouched
		await expect(button).not.toHaveClass(/(^|\s)flex(\s|$)/)
	})
})

test.describe('export', () => {
	test('writes the site to dist', async ({ editor: page, project }) => {
		await addSection(page, 'hero')
		const title = canvas(page).locator('h1')
		await title.dblclick()
		await page.keyboard.press('Control+A')
		await page.keyboard.type('Exported title')
		await page.keyboard.press('Escape')
		await expect(title).toHaveText('Exported title')

		await page.locator('[data-action="export"]').click()
		// A fresh site has audit issues, the dialog offers to export anyway
		const done = page.getByText('Site exported to dist')
		const anyway = page.getByRole('button', { name: 'Export anyway' })
		await expect(anyway.or(done)).toBeVisible()
		if (await anyway.isVisible()) await anyway.click()
		await expect(done).toBeVisible()

		const dist = path.join(project.dir, 'dist')
		const html = await readFile(path.join(dist, 'index.html'), 'utf8')
		expect(html).toContain('Exported title')
		expect(html).toContain('<title>')
		expect(html).not.toContain('data-node-id')
		const css = await readFile(
			path.join(dist, 'assets', 'site.css'),
			'utf8'
		)
		expect(css).toContain('.hero')
	})
})
