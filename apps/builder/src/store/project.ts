import { create } from 'zustand'
import type { Project } from '@/api'
import { useDocument } from '@/store/document'

export const CANVAS_WIDTHS = [
	{ label: 'Phone', width: 375 },
	{ label: 'md', width: 768 },
	{ label: 'lg', width: 1024 },
	{ label: 'xl', width: 1280 },
] as const

// Editor state that is not saved to the project
interface ProjectState {
	projectPath: string | null
	currentPageId: string | null
	canvasWidth: number
	selectedId: string | null
	hoveredId: string | null
	openProject: (project: Project) => void
	closeProject: () => void
	setCurrentPage: (id: string) => void
	setCanvasWidth: (width: number) => void
	select: (id: string | null) => void
	hover: (id: string | null) => void
}

export const useProject = create<ProjectState>((set) => ({
	projectPath: null,
	currentPageId: null,
	canvasWidth: 1280,
	selectedId: null,
	hoveredId: null,
	openProject: (project) => {
		useDocument.getState().load(project)
		set({
			projectPath: project.path,
			currentPageId: project.site.pages[0] ?? null,
			selectedId: null,
			hoveredId: null,
		})
	},
	closeProject: () => {
		useDocument.getState().clear()
		set({
			projectPath: null,
			currentPageId: null,
			selectedId: null,
			hoveredId: null,
		})
	},
	setCurrentPage: (id) =>
		set({ currentPageId: id, selectedId: null, hoveredId: null }),
	setCanvasWidth: (width) => set({ canvasWidth: width }),
	select: (id) => set({ selectedId: id }),
	hover: (id) => set({ hoveredId: id }),
}))

// The page shown on the canvas
export const useCurrentPage = () => {
	const id = useProject((s) => s.currentPageId)
	return useDocument((s) => (id ? s.doc?.pages[id] : undefined))
}
