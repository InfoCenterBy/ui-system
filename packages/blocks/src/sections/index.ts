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
	{ id: 'banner', name: 'Banners' },
	{ id: 'hero', name: 'Hero' },
	{ id: 'features', name: 'Features' },
	{ id: 'steps', name: 'Steps' },
	{ id: 'stats', name: 'Stats' },
	{ id: 'logos', name: 'Logos' },
	{ id: 'team', name: 'Team' },
	{ id: 'pricing', name: 'Pricing' },
	{ id: 'testimonials', name: 'Testimonials' },
	{ id: 'faq', name: 'FAQ' },
	{ id: 'blog', name: 'Blog' },
	{ id: 'gallery', name: 'Gallery' },
	{ id: 'content', name: 'Content' },
	{ id: 'contact', name: 'Contact' },
	{ id: 'cta', name: 'Call to action' },
	{ id: 'error', name: 'Error pages' },
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
	{
		id: 'header-centered',
		name: 'Centered',
		category: 'header',
		group: 'header',
	},
	{
		id: 'header-mobile',
		name: 'Mobile menu',
		category: 'header',
		group: 'header',
	},
	{ id: 'header-dark', name: 'Dark', category: 'header', group: 'header' },
	{ id: 'hero-centered', name: 'Centered', category: 'hero', group: 'hero' },
	{ id: 'hero-image', name: 'With image', category: 'hero', group: 'hero' },
	{
		id: 'hero-split-form',
		name: 'With form',
		category: 'hero',
		group: 'hero',
	},
	{
		id: 'hero-background',
		name: 'Background',
		category: 'hero',
		group: 'hero',
	},
	{ id: 'hero-stats', name: 'With stats', category: 'hero', group: 'hero' },
	{
		id: 'features-cards',
		name: 'Cards',
		category: 'features',
		group: 'features',
	},
	{
		id: 'features-icons',
		name: 'Icons',
		category: 'features',
		group: 'features',
	},
	{
		id: 'features-alternating',
		name: 'Alternating',
		category: 'features',
		group: 'features',
	},
	{
		id: 'features-checklist',
		name: 'Checklist',
		category: 'features',
		group: 'features',
	},
	{ id: 'stats-row', name: 'Row', category: 'stats', group: 'stats' },
	{ id: 'stats-cards', name: 'Cards', category: 'stats', group: 'stats' },
	{ id: 'logos-row', name: 'Row', category: 'logos' },
	{ id: 'team-grid', name: 'Grid', category: 'team', group: 'team' },
	{ id: 'team-cards', name: 'Cards', category: 'team', group: 'team' },
	{
		id: 'pricing-cards',
		name: 'Cards',
		category: 'pricing',
		group: 'pricing',
	},
	{
		id: 'pricing-simple',
		name: 'Single plan',
		category: 'pricing',
		group: 'pricing',
	},
	{
		id: 'pricing-table',
		name: 'Comparison',
		category: 'pricing',
		group: 'pricing',
	},
	{
		id: 'testimonials-cards',
		name: 'Cards',
		category: 'testimonials',
		group: 'testimonials',
	},
	{
		id: 'testimonials-single',
		name: 'Single quote',
		category: 'testimonials',
		group: 'testimonials',
	},
	{
		id: 'testimonials-grid',
		name: 'Grid',
		category: 'testimonials',
		group: 'testimonials',
	},
	{ id: 'faq-accordion', name: 'Accordion', category: 'faq', group: 'faq' },
	{
		id: 'faq-two-columns',
		name: 'Two columns',
		category: 'faq',
		group: 'faq',
	},
	{ id: 'contact-form', name: 'Form', category: 'contact', group: 'contact' },
	{
		id: 'contact-split',
		name: 'Info and form',
		category: 'contact',
		group: 'contact',
	},
	{
		id: 'contact-newsletter',
		name: 'Newsletter',
		category: 'contact',
		group: 'contact',
	},
	{ id: 'cta-banner', name: 'Banner', category: 'cta', group: 'cta' },
	{ id: 'cta-card', name: 'Card', category: 'cta', group: 'cta' },
	{ id: 'cta-image', name: 'With image', category: 'cta', group: 'cta' },
	{
		id: 'banner-announcement',
		name: 'Announcement',
		category: 'banner',
		group: 'banner',
	},
	{
		id: 'banner-promo',
		name: 'Promo strip',
		category: 'banner',
		group: 'banner',
	},
	{
		id: 'steps-numbered',
		name: 'Numbered',
		category: 'steps',
		group: 'steps',
	},
	{
		id: 'steps-timeline',
		name: 'Timeline',
		category: 'steps',
		group: 'steps',
	},
	{ id: 'blog-cards', name: 'Cards', category: 'blog', group: 'blog' },
	{ id: 'blog-list', name: 'List', category: 'blog', group: 'blog' },
	{ id: 'gallery-grid', name: 'Grid', category: 'gallery', group: 'gallery' },
	{
		id: 'gallery-masonry',
		name: 'Masonry',
		category: 'gallery',
		group: 'gallery',
	},
	{
		id: 'content-article',
		name: 'Article',
		category: 'content',
		group: 'content',
	},
	{ id: 'error-404', name: 'Not found', category: 'error', group: 'error' },
	{
		id: 'footer-simple',
		name: 'Simple',
		category: 'footer',
		group: 'footer',
	},
	{
		id: 'footer-columns',
		name: 'Columns',
		category: 'footer',
		group: 'footer',
	},
	{
		id: 'footer-newsletter',
		name: 'Newsletter',
		category: 'footer',
		group: 'footer',
	},
	{
		id: 'footer-social',
		name: 'Social',
		category: 'footer',
		group: 'footer',
	},
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
