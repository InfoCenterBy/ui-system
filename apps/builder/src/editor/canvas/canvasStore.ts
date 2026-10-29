import { create } from 'zustand'

// Live canvas document, shared by the overlay and inline editing
interface CanvasState {
	doc: Document | null
	// Node being edited inline, the canvas does not re-render it meanwhile
	editingId: string | null
	setDoc: (doc: Document | null) => void
	setEditing: (id: string | null) => void
}

export const useCanvas = create<CanvasState>((set) => ({
	doc: null,
	editingId: null,
	setDoc: (doc) => set({ doc }),
	setEditing: (editingId) => set({ editingId }),
}))
