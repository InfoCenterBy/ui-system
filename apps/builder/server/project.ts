import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import type { ElementNode, Page, Partials, Site } from '@ui-system/core'
import { HttpError } from './errors'
import { resolveInside, writeJson } from './fs-utils'
import { assertPage, assertPartial, assertSite } from './validate'

export interface Project {
	path: string
	site: Site
	pages: Page[]
	partials: Partials
}

export type PartialName = keyof Partials

async function readJson(file: string): Promise<unknown> {
	const name = path.basename(file)
	let text: string
	try {
		text = await readFile(file, 'utf8')
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new HttpError(404, `${name} not found`)
		}
		throw e
	}
	try {
		return JSON.parse(text)
	} catch {
		throw new HttpError(400, `${name} is not valid JSON`)
	}
}

async function isEmptyOrMissing(dir: string): Promise<boolean> {
	try {
		const s = await stat(dir)
		if (!s.isDirectory()) return false
		return (await readdir(dir)).length === 0
	} catch {
		return true
	}
}

export function defaultSite(name: string, homeId: string): Site {
	return {
		version: 1,
		name,
		lang: 'ru',
		pathPrefix: '',
		theme: { name: 'light', vars: {} },
		fonts: { heading: null, body: null },
		pages: [homeId],
	}
}

export function defaultPage(id: string, siteName: string): Page {
	return {
		id,
		slug: 'index',
		name: 'Home',
		meta: { title: siteName, description: '', ogImage: null },
		showHeader: true,
		showFooter: true,
		sections: [],
	}
}

// Holds the one open project in memory and mirrors changes to disk
export class ProjectStore {
	current: Project | null = null

	require(): Project {
		if (!this.current) throw new HttpError(404, 'No project is open')
		return this.current
	}

	assetsDir(): string {
		return resolveInside(this.require().path, 'assets')
	}

	async create(dir: string, name: string): Promise<Project> {
		const root = path.resolve(dir)
		if (!(await isEmptyOrMissing(root))) {
			throw new HttpError(409, 'Folder must be empty or not exist yet')
		}
		const homeId = 'home'
		const project: Project = {
			path: root,
			site: defaultSite(name, homeId),
			pages: [defaultPage(homeId, name)],
			partials: { header: null, footer: null },
		}
		await mkdir(path.join(root, 'assets'), { recursive: true })
		await writeJson(path.join(root, 'site.json'), project.site)
		await writeJson(
			path.join(root, 'pages', `${homeId}.json`),
			project.pages[0]
		)
		await writeJson(path.join(root, 'partials', 'header.json'), null)
		await writeJson(path.join(root, 'partials', 'footer.json'), null)
		this.current = project
		return project
	}

	async open(dir: string): Promise<Project> {
		const root = path.resolve(dir)
		const site = await readJson(path.join(root, 'site.json'))
		assertSite(site)
		const pages: Page[] = []
		for (const id of site.pages) {
			const page = await readJson(
				resolveInside(root, 'pages', `${id}.json`)
			)
			assertPage(page)
			pages.push(page)
		}
		const partials: Partials = { header: null, footer: null }
		for (const key of ['header', 'footer'] as const) {
			const file = path.join(root, 'partials', `${key}.json`)
			let value: unknown = null
			try {
				value = await readJson(file)
			} catch (e) {
				if (!(e instanceof HttpError && e.status === 404)) throw e
			}
			assertPartial(value)
			partials[key] = value
		}
		this.current = { path: root, site, pages, partials }
		return this.current
	}

	close(): void {
		this.current = null
	}

	async saveSite(site: Site): Promise<void> {
		const p = this.require()
		await writeJson(path.join(p.path, 'site.json'), site)
		p.site = site
	}

	async savePage(page: Page): Promise<void> {
		const p = this.require()
		const file = resolveInside(p.path, 'pages', `${page.id}.json`)
		await writeJson(file, page)
		const i = p.pages.findIndex((x) => x.id === page.id)
		if (i >= 0) p.pages[i] = page
		else p.pages.push(page)
	}

	// Also drops the id from site.pages so the project still opens
	async deletePage(id: string): Promise<void> {
		const p = this.require()
		if (!p.pages.some((x) => x.id === id)) {
			throw new HttpError(404, 'Page not found')
		}
		await rm(resolveInside(p.path, 'pages', `${id}.json`), { force: true })
		p.pages = p.pages.filter((x) => x.id !== id)
		if (p.site.pages.includes(id)) {
			await this.saveSite({
				...p.site,
				pages: p.site.pages.filter((x) => x !== id),
			})
		}
	}

	async savePartial(
		name: PartialName,
		value: ElementNode | null
	): Promise<void> {
		const p = this.require()
		await writeJson(
			resolveInside(p.path, 'partials', `${name}.json`),
			value
		)
		p.partials[name] = value
	}
}
