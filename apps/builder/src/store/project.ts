import { create } from 'zustand'
import type { Page, Partials, Site } from '@ui-system/core'
import type { Project } from '@/api'

export const CANVAS_WIDTHS = [
	{ label: 'Phone', width: 375 },
	{ label: 'md', width: 768 },
	{ label: 'lg', width: 1024 },
	{ label: 'xl', width: 1280 },
] as const

interface ProjectState {
	projectPath: string | null
	site: Site | null
	pages: Page[]
	partials: Partials
	currentPageId: string | null
	canvasWidth: number
	openProject: (project: Project) => void
	closeProject: () => void
	setCurrentPage: (id: string) => void
	setCanvasWidth: (width: number) => void
}

const emptyPartials: Partials = { header: null, footer: null }

export const useProject = create<ProjectState>((set) => ({
	projectPath: null,
	site: null,
	pages: [],
	partials: emptyPartials,
	currentPageId: null,
	canvasWidth: 1280,
	openProject: (project) =>
		set({
			projectPath: project.path,
			site: project.site,
			pages: project.pages,
			partials: project.partials,
			currentPageId: project.pages[0]?.id ?? null,
		}),
	closeProject: () =>
		set({
			projectPath: null,
			site: null,
			pages: [],
			partials: emptyPartials,
			currentPageId: null,
		}),
	setCurrentPage: (id) => set({ currentPageId: id }),
	setCanvasWidth: (width) => set({ canvasWidth: width }),
}))
