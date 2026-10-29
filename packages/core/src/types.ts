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
	section?: SectionInfo
}

export interface TextNode {
	id: NodeId
	type: 'text'
	text: string
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
	html: string
}
