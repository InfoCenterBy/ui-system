import type {
	Component,
	ElementNode,
	FontChoice,
	FontFile,
	Page,
	Partials,
	Site,
} from '@ui-system/core'
import { t } from '@/i18n'

export interface Project {
	path: string
	site: Site
	pages: Page[]
	partials: Partials
	components: Component[]
}

export interface Asset {
	path: string
	name: string
	size: number
	kind: 'image' | 'font'
}

export interface GoogleFontSuggestion {
	family: string
	category: string
	weights: number[]
}

export interface RecentProject {
	path: string
	name: string
	openedAt: string
}

async function request<T>(
	method: string,
	url: string,
	body?: unknown
): Promise<T> {
	const isForm = body instanceof FormData
	const res = await fetch(url, {
		method,
		headers:
			body === undefined || isForm
				? undefined
				: { 'Content-Type': 'application/json' },
		body: body === undefined || isForm ? body : JSON.stringify(body),
	})
	const data = await res.json().catch(() => null)
	if (!res.ok) {
		throw new Error(data?.error ?? t('err.request', { status: res.status }))
	}
	return data as T
}

export interface ComponentClass {
	name: string
	css: string
}

export interface ExportResult {
	dir: string
	pages: string[]
	files: number
	cssBytes: number
	script: boolean
	cally: boolean
	warnings: string[]
}

export const api = {
	recent: () => request<RecentProject[]>('GET', '/api/projects/recent'),
	create: (path: string, name: string, lang?: string) =>
		request<Project>('POST', '/api/projects/create', { path, name, lang }),
	open: (path: string) =>
		request<Project>('POST', '/api/projects/open', { path }),
	close: () => request<{ ok: true }>('POST', '/api/projects/close'),
	get: () => request<Project>('GET', '/api/project'),
	saveSite: (site: Site) =>
		request<{ ok: true }>('PUT', '/api/project/site', site),
	savePage: (page: Page) =>
		request<{ ok: true }>('PUT', `/api/project/pages/${page.id}`, page),
	deletePage: (id: string) =>
		request<{ ok: true }>('DELETE', `/api/project/pages/${id}`),
	savePartial: (name: keyof Partials, value: ElementNode | null) =>
		request<{ ok: true }>('PUT', `/api/project/partials/${name}`, value),
	saveComponent: (component: Component) =>
		request<{ ok: true }>(
			'PUT',
			`/api/project/components/${component.id}`,
			component
		),
	deleteComponent: (id: string) =>
		request<{ ok: true }>('DELETE', `/api/project/components/${id}`),
	css: (
		classes: string[],
		theme: Site['theme'],
		fonts?: Site['fonts'],
		tokens?: Site['tokens']
	) =>
		request<{ css: string }>('POST', '/api/css', {
			classes,
			theme,
			fonts,
			tokens,
		}),
	fontFaces: (choices: FontChoice[]) =>
		request<{ css: string }>('POST', '/api/fonts/css', { choices }),
	projectFonts: () => request<FontChoice[]>('GET', '/api/project/fonts'),
	searchGoogleFonts: (q: string) =>
		request<GoogleFontSuggestion[]>(
			'GET',
			`/api/fonts/google/search?q=${encodeURIComponent(q)}`
		),
	importGoogleFont: (input: {
		family: string
		weights: number[]
		italic: boolean
	}) => request<FontChoice>('POST', '/api/project/fonts/google', input),
	uploadFontFiles: (input: {
		family: string
		weight: number
		style: FontFile['style']
		files: File[]
	}) => {
		const form = new FormData()
		form.append('family', input.family)
		form.append('weight', String(input.weight))
		form.append('style', input.style)
		for (const file of input.files) form.append('files', file)
		return request<FontChoice>('POST', '/api/project/fonts/local', form)
	},
	componentClasses: () =>
		request<ComponentClass[]>('GET', '/api/classes/components'),
	assets: () => request<Asset[]>('GET', '/api/project/assets'),
	exportSite: () => request<ExportResult>('POST', '/api/project/export'),
	reveal: (folder: 'dist' | 'project') =>
		request<{ ok: true }>('POST', '/api/project/reveal', { folder }),
	placeholder: () =>
		request<{ path: string }>('POST', '/api/project/assets/placeholder'),
	upload: (file: File) => {
		const form = new FormData()
		form.append('file', file)
		return request<{ path: string }>('POST', '/api/project/assets', form)
	},
}
