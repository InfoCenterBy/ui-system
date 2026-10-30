import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
	materialize,
	parseSection,
	type Page,
	type Site,
} from '@ui-system/core'
import { createApp } from './app'
import { normalizePrefix, siteScript, sizesFor, takeScripts } from './export'
import type { Optimize } from './export'

let tmp: string
let app: ReturnType<typeof createApp>

// Pretends every png becomes two WebP sizes
const fakeOptimize: Optimize = async (input, outDir, baseName) => {
	if (!input.endsWith('.png')) return null
	await import('node:fs/promises').then((fs) =>
		fs.mkdir(outDir, { recursive: true })
	)
	for (const width of [480, 960]) {
		await writeFile(path.join(outDir, `${baseName}-${width}.webp`), 'webp')
	}
	return {
		width: 960,
		height: 480,
		variants: [
			{ file: `${baseName}-480.webp`, width: 480 },
			{ file: `${baseName}-960.webp`, width: 960 },
		],
	}
}

beforeEach(async () => {
	tmp = await mkdtemp(path.join(os.tmpdir(), 'ui-export-'))
	app = createApp({
		recentFile: path.join(tmp, 'recent.json'),
		optimize: fakeOptimize,
	})
})

// Windows can hold fresh files for a moment, so removal retries
afterEach(() =>
	rm(tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
)

const send = (method: string, url: string, body?: unknown) =>
	app.request(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body === undefined ? undefined : JSON.stringify(body),
	})

const section = (id: string, html: string) =>
	parseSection({ id, name: id, category: 'test', html })

const HERO = `<section class="hero bg-base-200">
	<img src="assets/photo.png" alt="Photo" data-edit="image">
	<a class="btn btn-primary" href="about.html" data-edit="link">About</a>
</section>`

const COUNTER = `<section class="p-4">
	<span id="count" class="countdown">0</span>
	<script>document.getElementById('count').textContent = '1'</script>
</section>`

async function setUp(prefix = '') {
	const dir = path.join(tmp, 'site')
	const project = await (
		await send('POST', '/api/projects/create', { path: dir, name: 'Demo' })
	).json()
	await writeFile(path.join(dir, 'assets', 'photo.png'), 'png')
	await writeFile(path.join(dir, 'assets', 'logo.svg'), '<svg/>')
	const home: Page = {
		...project.pages[0],
		meta: {
			title: 'Главная',
			description: 'About "us"',
			ogImage: 'assets/photo.png',
		},
		sections: [section('hero', HERO)],
	}
	const about: Page = {
		...home,
		id: 'about',
		slug: 'about',
		name: 'About',
		meta: { title: 'About', description: '', ogImage: null },
		showFooter: false,
		sections: [
			section('counter', COUNTER),
			section(
				'logo',
				'<div class="mt-8"><img src="assets/logo.svg" alt=""><img src="assets/gone.png" alt=""></div>'
			),
		],
	}
	const site: Site = {
		...project.site,
		pathPrefix: prefix,
		pages: ['home', 'about'],
	}
	await send('PUT', '/api/project/pages/home', home)
	await send('PUT', '/api/project/pages/about', about)
	await send('PUT', '/api/project/site', site)
	await send(
		'PUT',
		'/api/project/partials/footer',
		section(
			'footer',
			'<footer class="footer p-10"><p data-edit="text">Footer</p></footer>'
		)
	)
	return dir
}

describe('export', () => {
	it('writes pages, css, scripts and optimized images', async () => {
		const dir = await setUp()
		const res = await send('POST', '/api/project/export')
		expect(res.status).toBe(200)
		const result = await res.json()
		expect(result.pages).toEqual(['index.html', 'about.html'])
		expect(result.script).toBe(true)
		expect(result.warnings).toEqual(['Missing file assets/gone.png'])

		const dist = path.join(dir, 'dist')
		expect((await readdir(path.join(dist, 'assets'))).sort()).toEqual([
			'img',
			'logo.svg',
			'photo.png',
			'site.css',
			'site.js',
		])

		const index = await readFile(path.join(dist, 'index.html'), 'utf8')
		expect(index).toMatch(/^<!doctype html>\n<html lang="ru">/)
		expect(index).toContain('<title>Главная</title>')
		expect(index).toContain('content="About &quot;us&quot;"')
		expect(index).toContain(
			'<meta property="og:image" content="assets/photo.png">'
		)
		expect(index).toContain('src="assets/img/photo-960.webp"')
		expect(index).toContain(
			'srcset="assets/img/photo-480.webp 480w, assets/img/photo-960.webp 960w"'
		)
		expect(index).toContain('width="960" height="480"')
		// The first section loads its images right away
		expect(index).not.toContain('loading="lazy"')
		expect(index).not.toContain('site.js')
		expect(index).toContain('<footer class="footer p-10">')
		expect(index).not.toMatch(/data-edit|data-repeat|data-node-id/)

		const about = await readFile(path.join(dist, 'about.html'), 'utf8')
		expect(about).toContain('<script src="assets/site.js" defer></script>')
		expect(about).not.toContain('<script>')
		expect(about).not.toContain('<footer')
		expect(about).toContain('<img src="assets/logo.svg" alt="">')
		expect(about).toContain('src="assets/gone.png"')

		const js = await readFile(path.join(dist, 'assets', 'site.js'), 'utf8')
		expect(js).toContain("document.getElementById('count')")
		const css = await readFile(
			path.join(dist, 'assets', 'site.css'),
			'utf8'
		)
		expect(css).toContain('.btn-primary')
		expect(css).toContain('.countdown')
		expect(css).not.toContain('.card-body')
	})

	it('exports instances as plain markup', async () => {
		const dir = await setUp()
		const master = section(
			'card',
			'<section class="p-4"><h2 data-edit="text">Title</h2></section>'
		)
		const instance = materialize(master, 'c1', () => 'i' + Math.random())
		const project = await (await send('GET', '/api/project')).json()
		await send('PUT', '/api/project/components/c1', {
			id: 'c1',
			name: 'Card',
			root: master,
		})
		await send('PUT', '/api/project/pages/about', {
			...project.pages[1],
			sections: [instance],
		})
		await send('POST', '/api/project/export')
		const about = await readFile(
			path.join(dir, 'dist', 'about.html'),
			'utf8'
		)
		expect(about).toContain('<section class="p-4">')
		expect(about).toContain('<h2>Title</h2>')
		expect(about).not.toMatch(/instance|component|data-ref|data-node-id/)
	})

	it('puts the path prefix in front of asset urls only', async () => {
		const dir = await setUp('/local/templates/site')
		await send('POST', '/api/project/export')
		const index = await readFile(
			path.join(dir, 'dist', 'index.html'),
			'utf8'
		)
		expect(index).toContain('href="/local/templates/site/assets/site.css"')
		expect(index).toContain(
			'src="/local/templates/site/assets/img/photo-960.webp"'
		)
		expect(index).toContain('href="about.html"')
	})

	it('needs an open project', async () => {
		expect((await send('POST', '/api/project/export')).status).toBe(404)
	})
})

describe('export helpers', () => {
	it('normalizes the prefix', () => {
		expect(normalizePrefix('')).toBe('')
		expect(normalizePrefix(' /x ')).toBe('/x/')
		expect(normalizePrefix('/x/')).toBe('/x/')
	})

	it('adds feature scripts and Cally only to pages that use them', async () => {
		const dir = await setUp()
		const project = await (await send('GET', '/api/project')).json()
		const rich = section(
			'rich',
			`<section class="p-4">
	<button class="btn" command="show-modal" commandfor="m">Open</button>
	<dialog id="m" class="modal"><div class="modal-box">Hi</div></dialog>
	<div data-countdown-to="2030-01-01T00:00"><span data-countdown="days" style="--value: 1">1</span></div>
	<calendar-date class="cally"><calendar-month></calendar-month></calendar-date>
</section>`
		)
		await send('PUT', '/api/project/pages/about', {
			...project.pages[1],
			sections: [rich],
		})
		await send('PUT', '/api/project/pages/home', {
			...project.pages[0],
			sections: [
				section('plain', '<section class="p-4">Plain</section>'),
			],
		})
		const result = await (await send('POST', '/api/project/export')).json()
		expect(result.cally).toBe(true)
		const dist = path.join(dir, 'dist')
		const about = await readFile(path.join(dist, 'about.html'), 'utf8')
		expect(about).toContain('<script src="assets/site.js" defer>')
		expect(about).toContain('<script src="assets/js/cally.js" defer>')
		expect(about).toContain('commandfor="m"')
		const index = await readFile(path.join(dist, 'index.html'), 'utf8')
		expect(index).not.toMatch(/site\.js|cally/)
		const js = await readFile(path.join(dist, 'assets', 'site.js'), 'utf8')
		expect(js).toContain("'show-modal': 'showModal'")
		expect(js).toContain('data-countdown-to')
		const cally = await readFile(
			path.join(dist, 'assets', 'js', 'cally.js'),
			'utf8'
		)
		expect(cally).toMatch(/^\/\*! Cally, MIT license/)
		expect(cally).toContain('customElements')
		expect(cally).not.toMatch(/^export /m)
	})

	it('writes no site.js or Cally for plain pages', async () => {
		const dir = await setUp()
		const project = await (await send('GET', '/api/project')).json()
		await send('PUT', '/api/project/pages/about', {
			...project.pages[1],
			sections: [
				section('plain', '<section class="p-4">Plain</section>'),
			],
		})
		const result = await (await send('POST', '/api/project/export')).json()
		expect(result.script).toBe(false)
		expect(result.cally).toBe(false)
		const files = await readdir(path.join(dir, 'dist', 'assets'))
		expect(files).not.toContain('js')
		expect(files).not.toContain('site.js')
	})

	it('moves inline scripts out and keeps external ones', () => {
		const roots = [
			section(
				'a',
				'<div><script src="https://x.js"></script><script>a()</script></div>'
			),
		]
		expect(takeScripts(roots)).toEqual(['a()'])
		expect(roots[0].children).toHaveLength(1)
		expect(siteScript(['a()', 'a()', 'b()'])).toBe(
			';(() => {\na()\n})()\n\n;(() => {\nb()\n})()\n'
		)
	})

	it('limits image sizes by max-width classes', () => {
		expect(sizesFor('w-full')).toBe('100vw')
		expect(sizesFor('w-full max-w-sm rounded-box')).toBe(
			'(max-width: 384px) 100vw, 384px'
		)
		expect(sizesFor('max-w-7xl max-w-md')).toBe(
			'(max-width: 448px) 100vw, 448px'
		)
	})
})

describe('page shell', () => {
	const putLayout = async (layout: Site['layout']) => {
		const project = await (await send('GET', '/api/project')).json()
		const res = await send('PUT', '/api/project/site', {
			...project.site,
			layout,
		})
		expect(res.status).toBe(200)
	}
	const exportIndex = async (dir: string) => {
		await send('POST', '/api/project/export')
		const dist = path.join(dir, 'dist')
		const read = (file: string) =>
			readFile(path.join(dist, file), 'utf8').catch(() => '')
		return {
			html: await read('index.html'),
			css: await read('assets/site.css'),
			js: await read('assets/site.js'),
		}
	}
	const withHeader = async () => {
		const dir = await setUp()
		await send(
			'PUT',
			'/api/project/partials/header',
			section('header', '<header class="bg-base-100 p-4">Nav</header>')
		)
		return dir
	}

	it('sticks the footer by default', async () => {
		const dir = await setUp()
		const { html, css } = await exportIndex(dir)
		expect(html).toContain('<body class="flex min-h-dvh flex-col">')
		expect(html).toMatch(/<main class="grow">[\s\S]*<\/main>\n\t<footer/)
		expect(css).toContain('.min-h-dvh')
		expect(css).toContain('.grow')
		expect(css).toContain('.flex-col')
	})

	it('leaves the body plain when the footer does not stick', async () => {
		const dir = await setUp()
		await putLayout({ stickyFooter: false })
		const { html, css } = await exportIndex(dir)
		expect(html).toContain('<body>')
		expect(html).toContain('<main>')
		expect(html).not.toContain('min-h-dvh')
		expect(css).not.toContain('.min-h-dvh')
	})

	it('adds header position classes to the exported header only', async () => {
		const dir = await withHeader()
		const expected = {
			static: '<header class="bg-base-100 p-4">',
			sticky: '<header class="bg-base-100 p-4 sticky top-0 z-40">',
			fixed: '<header class="bg-base-100 p-4 fixed inset-x-0 top-0 z-40">',
		} as const
		for (const header of ['static', 'sticky', 'fixed'] as const) {
			await putLayout({ header })
			const { html, css } = await exportIndex(dir)
			expect(html).toContain(expected[header])
			expect(html).not.toContain('data-header')
			if (header === 'sticky') expect(css).toContain('.sticky')
			if (header === 'fixed') expect(css).toContain('.fixed')
		}
		const stored = await (await send('GET', '/api/project')).json()
		expect(stored.partials.header.classes).toBe('bg-base-100 p-4')
	})

	it('writes the autohide script only for autohide pages with a header', async () => {
		const dir = await withHeader()
		await putLayout({ header: 'sticky' })
		const sticky = await exportIndex(dir)
		expect(sticky.js).not.toContain('autohide')
		expect(sticky.html).not.toContain('site.js')
		await putLayout({ header: 'autohide' })
		const shown = await exportIndex(dir)
		expect(shown.html).toContain('data-header="autohide"')
		expect(shown.html).toContain('<script src="assets/site.js" defer>')
		expect(shown.js).toContain('[data-header="autohide"]')
		expect(shown.css).toContain('.transition-transform')
		// A page without the header gets no hook and no script tag
		const project = await (await send('GET', '/api/project')).json()
		await send('PUT', '/api/project/pages/home', {
			...project.pages[0],
			showHeader: false,
		})
		const hidden = await exportIndex(dir)
		expect(hidden.html).not.toContain('data-header')
		expect(hidden.html).not.toContain('site.js')
	})

	it('rejects unknown layout values', async () => {
		await setUp()
		const project = await (await send('GET', '/api/project')).json()
		for (const layout of [
			{ header: 'floating' },
			{ stickyFooter: 'yes' },
			'sticky',
		]) {
			const res = await send('PUT', '/api/project/site', {
				...project.site,
				layout,
			})
			expect(res.status).toBe(400)
		}
		const ok = await send('PUT', '/api/project/site', project.site)
		expect(ok.status).toBe(200)
	})
})
