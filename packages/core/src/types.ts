export type NodeId = string

// What an editable place accepts, set with data-edit in section HTML
export type SlotKind = 'text' | 'rich' | 'image' | 'link'

export interface ElementNode {
	id: NodeId
	type: 'element'
	tag: string
	// Tailwind classes, the only source of styles
	classes: string
	// Every other attribute in source order, class and builder markers excluded
	attrs: Record<string, string>
	children: TreeNode[]
	slot?: SlotKind
	// Items sharing a repeat group can be added, removed and reordered
	repeat?: string
	// Name shown in the layers panel, set with data-label in library HTML
	label?: string
	section?: SectionInfo
	// Set on the root of a component instance
	instance?: InstanceInfo
	// Inside an instance: id of the matching node in the component master
	ref?: NodeId
}

export interface TextNode {
	id: NodeId
	type: 'text'
	text: string
	ref?: NodeId
}

export interface InstanceInfo {
	component: string
}

export interface Component {
	id: string
	name: string
	// Master tree, plain nodes without instance or ref markers
	root: ElementNode
}

export type TreeNode = ElementNode | TextNode

export interface SectionInfo {
	// Preset the section was created from
	preset: string
	// Locked sections only allow slot and repeat edits
	locked: boolean
}

export interface PageMeta {
	title: string
	description: string
	ogImage: string | null
	// Hides the page from search engines and the sitemap
	noindex?: boolean
}

// Custom code added only to the exported pages
export interface CustomCode {
	head: string
	body: string
}

export interface Page {
	id: string
	// File name without .html, index for the home page
	slug: string
	name: string
	meta: PageMeta
	showHeader: boolean
	showFooter: boolean
	sections: ElementNode[]
	code?: CustomCode
}

export interface FontChoice {
	family: string
	// Files in assets/fonts, imported from Google Fonts or from disk
	files: FontFile[]
}

export interface FontFile {
	weight: number
	style: 'normal' | 'italic'
	file: string
	// Set for Google Fonts subsets so each file only covers its own characters
	unicodeRange?: string
}

export type HeaderPosition = 'static' | 'sticky' | 'fixed' | 'autohide'

export interface SiteLayout {
	header?: HeaderPosition
	stickyFooter?: boolean
	// Header menus are refilled whenever pages change
	menuSync?: boolean
}

export interface Site {
	version: 1
	name: string
	lang: string
	// Prefix for asset paths in the export, empty for relative paths
	pathPrefix: string
	// daisyUI theme variables from the theme generator
	theme: { name: string; vars: Record<string, string> }
	fonts: { heading: FontChoice | null; body: FontChoice | null }
	// Page ids in navigation order
	pages: string[]
	// Page shell, missing means a static header and a sticky footer
	layout?: SiteLayout
	// Public address like https://example.com, for canonical, sitemap and og:url
	url?: string
	// Project asset used as the favicon
	favicon?: string | null
	code?: CustomCode
}

export interface Partials {
	header: ElementNode | null
	footer: ElementNode | null
}

export interface SectionPreset {
	id: string
	name: string
	category: string
	// Presets in one group are layout variants of each other
	group?: string
	// Presets start locked unless this is false
	locked?: boolean
	html: string
}
