import type { HeaderPosition, SiteLayout } from './types'

export const HEADER_POSITIONS: HeaderPosition[] = [
	'static',
	'sticky',
	'fixed',
	'autohide',
]

export const resolveLayout = (layout?: SiteLayout) => ({
	header: layout?.header ?? 'static',
	stickyFooter: layout?.stickyFooter ?? true,
})

// Classes the export puts on the header root, never stored in the partial
export const HEADER_CLASSES: Record<HeaderPosition, string> = {
	static: '',
	sticky: 'sticky top-0 z-40',
	fixed: 'fixed inset-x-0 top-0 z-40',
	autohide:
		'sticky top-0 z-40 transition-transform duration-300 motion-reduce:transition-none',
}

// A full-height column whose main part grows, so the footer sits at the window bottom
export const BODY_CLASSES = 'flex min-h-dvh flex-col'
export const MAIN_CLASSES = 'grow'
