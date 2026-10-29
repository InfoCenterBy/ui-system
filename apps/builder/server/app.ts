import { readFile } from 'node:fs/promises'
import { Hono, type Context } from 'hono'
import { getMimeType } from 'hono/utils/mime'
import { saveUpload } from './assets'
import { CssBuilder } from './css'
import { HttpError } from './errors'
import { resolveInside } from './fs-utils'
import { ProjectStore, type PartialName } from './project'
import { addRecent, defaultRecentFile, readRecent } from './recent'
import { assertPage, assertPartial, assertSite, assertString } from './validate'

export interface AppOptions {
	// Where recent projects are stored, defaults to ~/.ui-builder/recent.json
	recentFile?: string
}

async function body(c: Context): Promise<unknown> {
	try {
		return await c.req.json()
	} catch {
		throw new HttpError(400, 'Body must be JSON')
	}
}

function pathBody(v: unknown): string {
	const p = (v as { path?: unknown } | null)?.path
	assertString(p, 'path')
	return p
}

export function createApp(options: AppOptions = {}) {
	const recentFile = options.recentFile ?? defaultRecentFile()
	const store = new ProjectStore()
	const css = new CssBuilder()
	const app = new Hono()

	app.onError((err, c) => {
		if (err instanceof HttpError) {
			return c.json({ error: err.message }, err.status)
		}
		console.error(err)
		return c.json({ error: 'Internal server error' }, 500)
	})

	app.get('/api/projects/recent', async (c) =>
		c.json(await readRecent(recentFile))
	)

	app.post('/api/projects/create', async (c) => {
		const data = (await body(c)) as { name?: unknown }
		const dir = pathBody(data)
		assertString(data.name, 'name')
		const project = await store.create(dir, data.name.trim())
		await addRecent(recentFile, {
			path: project.path,
			name: data.name.trim(),
		})
		return c.json(project)
	})

	app.post('/api/projects/open', async (c) => {
		const project = await store.open(pathBody(await body(c)))
		await addRecent(recentFile, {
			path: project.path,
			name: project.site.name,
		})
		return c.json(project)
	})

	app.post('/api/projects/close', (c) => {
		store.close()
		return c.json({ ok: true })
	})

	app.get('/api/project', (c) => c.json(store.require()))

	app.put('/api/project/site', async (c) => {
		const site = await body(c)
		assertSite(site)
		await store.saveSite(site)
		return c.json({ ok: true })
	})

	app.put('/api/project/pages/:id', async (c) => {
		const page = await body(c)
		assertPage(page)
		if (page.id !== c.req.param('id')) {
			throw new HttpError(400, 'Page id does not match the URL')
		}
		await store.savePage(page)
		return c.json({ ok: true })
	})

	app.delete('/api/project/pages/:id', async (c) => {
		const id = c.req.param('id')
		if (!/^[a-z0-9-]+$/.test(id))
			throw new HttpError(400, 'Invalid page id')
		await store.deletePage(id)
		return c.json({ ok: true })
	})

	app.put('/api/project/partials/:name', async (c) => {
		const name = c.req.param('name')
		if (name !== 'header' && name !== 'footer') {
			throw new HttpError(400, 'Partial must be header or footer')
		}
		const value = await body(c)
		assertPartial(value)
		await store.savePartial(name as PartialName, value)
		return c.json({ ok: true })
	})

	app.post('/api/project/assets', async (c) => {
		const dir = store.assetsDir()
		const form = await c.req.parseBody().catch(() => {
			throw new HttpError(400, 'Body must be multipart form data')
		})
		const file = form.file
		if (!(file instanceof File))
			throw new HttpError(400, 'Field file is missing')
		const name = await saveUpload(dir, file)
		return c.json({ path: `assets/${name}` })
	})

	// Canvas styles, built by the same Tailwind and daisyUI setup as the export
	app.post('/api/css', async (c) => {
		const data = (await body(c)) as {
			classes?: unknown
			theme?: { name?: unknown; vars?: unknown }
		}
		const { classes, theme } = data
		if (
			!Array.isArray(classes) ||
			!classes.every((name) => typeof name === 'string')
		) {
			throw new HttpError(400, 'classes must be a list of strings')
		}
		if (
			typeof theme?.name !== 'string' ||
			typeof theme.vars !== 'object' ||
			theme.vars === null
		) {
			throw new HttpError(400, 'theme needs a name and vars')
		}
		const text = await css.build(classes, {
			name: theme.name,
			vars: theme.vars as Record<string, string>,
		})
		return c.json({ css: text })
	})

	app.get('/assets/*', async (c) => {
		const dir = store.assetsDir()
		let rel: string
		try {
			rel = decodeURIComponent(c.req.path.slice('/assets/'.length))
		} catch {
			throw new HttpError(400, 'Invalid path')
		}
		const file = resolveInside(dir, rel)
		let data: Buffer
		try {
			data = await readFile(file)
		} catch {
			throw new HttpError(404, 'File not found')
		}
		const type = getMimeType(file) ?? 'application/octet-stream'
		return c.body(new Uint8Array(data), 200, { 'Content-Type': type })
	})

	return app
}
