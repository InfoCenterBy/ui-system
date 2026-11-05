import {
	getUtility,
	resolveUtility,
	type Breakpoint,
	type UtilityGroup,
} from '@ui-system/core'

// Screens edited side by side, Bootstrap style: xs is every screen, the rest are "from" widths
export const SCREENS: Breakpoint[] = ['', 'sm', 'md', 'lg', 'xl']

export const screenName = (bp: Breakpoint) => (bp === '' ? 'xs' : bp)

export interface ScreenOption {
	value: string
	label: string
}

export interface ScreenCell {
	// Value written at this screen, null when it is inherited
	own: string | null
	// Value in effect at this screen
	shown: string | null
}

export interface ScreenRow {
	label?: string
	// Per screen when the choices depend on it, e.g. spans up to that screen's column count
	options: ScreenOption[] | ((bp: Breakpoint) => ScreenOption[])
	cell: (bp: Breakpoint) => ScreenCell
	onChange: (bp: Breakpoint, value: string | null) => void
}

// Own and resolved value of a utility group at a screen
export const utilityCell = (
	classes: string,
	group: UtilityGroup,
	bp: Breakpoint
): ScreenCell => ({
	own: getUtility(classes, group, bp),
	shown: resolveUtility(classes, group, bp)?.utility ?? null,
})
