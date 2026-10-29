import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app'

let tmp: string
let app: ReturnType<typeof createApp>

beforeEach(async () => {
	tmp = await mkdtemp(path.join(os.tmpdir(), 'ui-builder-'))
	app = createApp({ recentFile: path.join(tmp, 'recent.json') })
})

// Windows can hold fresh files for a moment, so removal retries
afterEach(() =>
	rm(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
)

function send(method: string, url: string, body?: unknown) {
	return app.request(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body),
	})
}

async function createProject(name = 'Demo') {
	const dir = path.join(tmp, 'site')
	const res = await send('POST', '/api/projects/create', { path: dir, name })
	return { dir, res }
}

function upload(name: string, content = 'x', type = 'image/png') {
	const form = new FormData()
	form.append('file', new File([content], name, { type }))
	return app.request('/api/project/assets', { method: 'POST', body: form })
}

describe('create and open', () => {
	it('creates a project with the default layout', async () => {
		const { dir, res } = await createProject()
		expect(res.status).toBe(200)
		const project = await res.json()
		expect(project.site.name).toBe('Demo')
		expect(project.site.lang).toBe('ru')
		expect(project.pages).toHaveLength(1)
		expect(project.pages[0].slug).toBe('index')
		expect(project.partials).toEqual({ header: null, footer: null })

		const siteText = await readFile(path.join(dir, 'site.json'), 'utf8')
		expect(siteText.endsWith('}\n')).toBe(true)
		expect(siteText).toContain('\n\t"version": 1')
		expect(await readdir(path.join(dir, 'assets'))).toEqual([])
		const header = await readFile(
			path.join(dir, 'partials/header.json'),
			'utf8'
		)
		expect(header).toBe('null\n')
	})

	it('refuses a folder that is not empty', async () => {
		await writeFile(path.join(tmp, 'x.txt'), '')
		const res = await send('POST', '/api/projects/create', {
			path: tmp,
			name: 'A',
		})
		expect(res.status).toBe(409)
		expect(await res.json()).toHaveProperty('error')
	})

	it('opens a project created earlier and loads the pages', async () => {
		const { dir } = await createProject()
		await send('POST', '/api/projects/close')
		expect((await send('GET', '/api/project')).status).toBe(404)

		const res = await send('POST', '/api/projects/open', { path: dir })
		expect(res.status).toBe(200)
		const project = await res.json()
		expect(project.pages[0].id).toBe(project.site.pages[0])
		expect((await send('GET', '/api/project')).status).toBe(200)
	})

	it('rejects a folder without site.json', async () => {
		const res = await send('POST', '/api/projects/open', { path: tmp })
		expect(res.status).toBe(404)
	})

	it('rejects a broken site.json', async () => {
		await writeFile(path.join(tmp, 'site.json'), '{ nope')
		const res = await send('POST', '/api/projects/open', { path: tmp })
		expect(res.status).toBe(400)
	})
})

describe('recent projects', () => {
	it('lists newest first without duplicates', async () => {
		const a = path.join(tmp, 'a')
		const b = path.join(tmp, 'b')
		await send('POST', '/api/projects/create', { path: a, name: 'A' })
		await send('POST', '/api/projects/create', { path: b, name: 'B' })
		await send('POST', '/api/projects/open', { path: a })
		const list = await (await send('GET', '/api/projects/recent')).json()
		expect(list.map((r: { name: string }) => r.name)).toEqual(['A', 'B'])
		expect(list[0]).toHaveProperty('openedAt')
	})

	it('keeps at most 10 entries', async () => {
		for (let i = 0; i < 12; i++) {
			await send('POST', '/api/projects/create', {
				path: path.join(tmp, `p${i}`),
				name: `P${i}`,
			})
		}
		const list = await (await send('GET', '/api/projects/recent')).json()
		expect(list).toHaveLength(10)
		expect(list[0].name).toBe('P11')
	})
})

describe('site, pages and partials', () => {
	it('saves and deletes a page', async () => {
		const { dir, res } = await createProject()
		const project = await res.json()
		const page = { ...project.pages[0], id: 'about', slug: 'about' }

		const put = await send('PUT', '/api/project/pages/about', page)
		expect(put.status).toBe(200)
		const saved = await readFile(path.join(dir, 'pages/about.json'), 'utf8')
		expect(JSON.parse(saved).slug).toBe('about')
		expect(
			(await (await send('GET', '/api/project')).json()).pages
		).toHaveLength(2)

		const del = await send('DELETE', '/api/project/pages/about')
		expect(del.status).toBe(200)
		expect(await readdir(path.join(dir, 'pages'))).toEqual(['home.json'])
		expect((await send('DELETE', '/api/project/pages/about')).status).toBe(
			404
		)
	})

	it('rejects a page whose id does not match the URL', async () => {
		const { res } = await createProject()
		const page = (await res.json()).pages[0]
		const put = await send('PUT', '/api/project/pages/other', page)
		expect(put.status).toBe(400)
	})

	it('rejects unsafe page ids', async () => {
		const { res } = await createProject()
		const page = (await res.json()).pages[0]
		const bad = await send('PUT', '/api/project/pages/..%2Fevil', {
			...page,
			id: '../evil',
		})
		expect(bad.status).toBe(400)
		const del = await send('DELETE', '/api/project/pages/..%2Fevil')
		expect(del.status).toBe(400)
		const upper = await send('PUT', '/api/project/pages/Foo', {
			...page,
			id: 'Foo',
		})
		expect(upper.status).toBe(400)
	})

	it('saves the site and rejects a bad body', async () => {
		const { dir, res } = await createProject()
		const site = { ...(await res.json()).site, name: 'Renamed' }
		expect((await send('PUT', '/api/project/site', site)).status).toBe(200)
		const text = await readFile(path.join(dir, 'site.json'), 'utf8')
		expect(JSON.parse(text).name).toBe('Renamed')
		expect(
			(await send('PUT', '/api/project/site', { name: 1 })).status
		).toBe(400)
	})

	it('saves partials and accepts null', async () => {
		const { dir } = await createProject()
		const node = {
			id: 'h1',
			type: 'element',
			tag: 'header',
			classes: '',
			attrs: {},
			children: [],
		}
		expect(
			(await send('PUT', '/api/project/partials/header', node)).status
		).toBe(200)
		const text = await readFile(
			path.join(dir, 'partials/header.json'),
			'utf8'
		)
		expect(JSON.parse(text).tag).toBe('header')

		expect(
			(await send('PUT', '/api/project/partials/header', null)).status
		).toBe(200)
		expect(
			await readFile(path.join(dir, 'partials/header.json'), 'utf8')
		).toBe('null\n')
		expect(
			(await send('PUT', '/api/project/partials/nav', node)).status
		).toBe(400)
		expect(
			(await send('PUT', '/api/project/partials/footer', { tag: 1 }))
				.status
		).toBe(400)
	})

	it('answers 404 for writes when no project is open', async () => {
		const res = await send('PUT', '/api/project/partials/header', null)
		expect(res.status).toBe(404)
	})
})

describe('assets', () => {
	it('uploads, makes names unique and serves the file', async () => {
		const { dir } = await createProject()
		const first = await (await upload('My Photo!.PNG', 'abc')).json()
		expect(first.path).toBe('assets/my-photo.png')
		const second = await (await upload('My Photo!.PNG', 'def')).json()
		expect(second.path).toBe('assets/my-photo-2.png')
		const third = await (await upload('My Photo!.PNG')).json()
		expect(third.path).toBe('assets/my-photo-3.png')
		expect(await readFile(path.join(dir, second.path), 'utf8')).toBe('def')

		const res = await app.request('/assets/my-photo.png')
		expect(res.status).toBe(200)
		expect(res.headers.get('Content-Type')).toBe('image/png')
		expect(await res.text()).toBe('abc')
		expect((await app.request('/assets/missing.png')).status).toBe(404)
	})

	it('rejects disallowed types and big files', async () => {
		await createProject()
		expect((await upload('run.exe')).status).toBe(415)
		expect((await upload('noext')).status).toBe(415)
		const big = 'x'.repeat(20 * 1024 * 1024 + 1)
		expect((await upload('big.png', big)).status).toBe(413)
	})

	it('rejects a request without a file', async () => {
		await createProject()
		const res = await app.request('/api/project/assets', {
			method: 'POST',
			body: new FormData(),
		})
		expect(res.status).toBe(400)
	})
})

describe('path traversal', () => {
	it('does not serve files outside assets', async () => {
		await createProject()
		const res = await app.request('/assets/..%2Fsite.json')
		expect(res.status).toBe(400)
		const nested = await app.request('/assets/%2E%2E/%2E%2E/site.json')
		expect([400, 404]).toContain(nested.status)
	})

	it('does not name an upload after a path', async () => {
		const { dir } = await createProject()
		const res = await upload('../../evil.png')
		expect((await res.json()).path).toBe('assets/evil.png')
		expect(await readdir(path.join(dir, 'assets'))).toEqual(['evil.png'])
	})

	it('refuses to open a site that lists an unsafe page id', async () => {
		const { dir, res } = await createProject()
		const site = { ...(await res.json()).site, pages: ['../../x'] }
		await writeFile(path.join(dir, 'site.json'), JSON.stringify(site))
		const open = await send('POST', '/api/projects/open', { path: dir })
		expect(open.status).toBe(400)
	})
})
