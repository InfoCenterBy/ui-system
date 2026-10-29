/// <reference types="vite/client" />
import type { SectionPreset } from '@ui-system/core'

export interface SectionCategory {
	id: string
	name: string
}

export const sectionCategories: SectionCategory[] = [
	{ id: 'hero', name: 'Hero' },
	{ id: 'features', name: 'Features' },
	{ id: 'footer', name: 'Footer' },
]

// Order inside a category is the order in the builder catalog
const presetMeta: Omit<SectionPreset, 'html'>[] = [
	{ id: 'hero-centered', name: 'Centered', category: 'hero', group: 'hero' },
	{ id: 'hero-image', name: 'With image', category: 'hero', group: 'hero' },
	{ id: 'features-cards', name: 'Cards', category: 'features' },
	{ id: 'footer-simple', name: 'Simple', category: 'footer' },
]

const files = import.meta.glob<string>('./*/*.html', {
	query: '?raw',
	import: 'default',
	eager: true,
})

export const sectionPresets: SectionPreset[] = presetMeta.map((meta) => {
	const html = files[`./${meta.category}/${meta.id}.html`]
	if (html === undefined) {
		throw new Error(`Missing sections/${meta.category}/${meta.id}.html`)
	}
	return { ...meta, html }
})

export const getSectionPreset = (id: string) =>
	sectionPresets.find((preset) => preset.id === id)
