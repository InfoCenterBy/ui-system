import { create } from 'zustand'

// Which navigator rows are expanded, kept while switching tabs
interface NavState {
	open: Record<string, boolean>
	setOpen: (ids: string[], value?: boolean) => void
	toggle: (id: string) => void
}

export const useNav = create<NavState>((set) => ({
	open: {},
	setOpen: (ids, value = true) =>
		set((s) => {
			const open = { ...s.open }
			for (const id of ids) open[id] = value
			return { open }
		}),
	toggle: (id) => set((s) => ({ open: { ...s.open, [id]: !s.open[id] } })),
}))
