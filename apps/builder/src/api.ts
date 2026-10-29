import type { ElementNode, Page, Partials, Site } from '@ui-system/core'

export interface Project {
	path: string
	site: Site
	pages: Page[]
	partials: Partials
}

export interface Asset {
	path: string
	name: string
	size: number
	kind: 'image' | 'font'
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
		throw new Error(data?.error ?? `Request failed (${res.status})`)
	}
	return data as T
}

export const api = {
	recent: () => request<RecentProject[]>('GET', '/api/projects/recent'),
	create: (path: string, name: string) =>
		request<Project>('POST', '/api/projects/create', { path, name }),
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
	css: (classes: string[], theme: Site['theme']) =>
		request<{ css: string }>('POST', '/api/css', { classes, theme }),
	assets: () => request<Asset[]>('GET', '/api/project/assets'),
	upload: (file: File) => {
		const form = new FormData()
		form.append('file', file)
		return request<{ path: string }>('POST', '/api/project/assets', form)
	},
}
