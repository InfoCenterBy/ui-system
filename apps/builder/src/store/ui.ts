import { create } from 'zustand'

// Editor chrome state that is not saved to the project
interface UiState {
	preview: boolean
	palette: boolean
	// Overview of the page animations
	reveals: boolean
	setPreview: (on: boolean) => void
	setPalette: (on: boolean) => void
	setReveals: (on: boolean) => void
}

export const useUi = create<UiState>((set) => ({
	preview: false,
	palette: false,
	reveals: false,
	setPreview: (preview) => set({ preview }),
	setPalette: (palette) => set({ palette }),
	setReveals: (reveals) => set({ reveals }),
}))
