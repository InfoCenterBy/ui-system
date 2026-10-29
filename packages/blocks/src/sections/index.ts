/// <reference types="vite/client" />
import type { SectionPreset } from '@ui-system/core'

export interface SectionCategory {
	id: string
	name: string
	// Presets of this category become the site-wide header or footer
	shared?: 'header' | 'footer'
}

export const sectionCategories: SectionCategory[] = [
	{ id: 'header', name: 'Header', shared: 'header' },
	{ id: 'hero', name: 'Hero' },
	{ id: 'features', name: 'Features' },
	{ id: 'footer', name: 'Footer', shared: 'footer' },
]

// Order inside a category is the order in the builder catalog
const presetMeta: Omit<SectionPreset, 'html'>[] = [
	{
		id: 'header-simple',
		name: 'Simple',
		category: 'header',
		group: 'header',
	},
	{
		id: 'header-cta',
		name: 'With button',
		category: 'header',
		group: 'header',
	},
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

export const sharedRoleOf = (presetId: string) => {
	const preset = getSectionPreset(presetId)
	return sectionCategories.find((c) => c.id === preset?.category)?.shared
}
