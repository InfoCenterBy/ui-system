import {
	getUtility,
	resolveUtility,
	setUtility,
	splitClasses,
	parseClass,
	groupOf,
	type Breakpoint,
} from './classes'

export type Device = 'phone' | 'tablet' | 'desktop'

// Same widths as the canvas device switcher: phone is the base, tablet md, desktop lg
export const DEVICES: { device: Device; breakpoint: Breakpoint }[] = [
	{ device: 'phone', breakpoint: '' },
	{ device: 'tablet', breakpoint: 'md' },
	{ device: 'desktop', breakpoint: 'lg' },
]

export type Visibility = Record<Device, boolean>

export const readVisibility = (classes: string): Visibility => {
	const visible = (breakpoint: Breakpoint) =>
		resolveUtility(classes, 'display', breakpoint)?.utility !== 'hidden'
	return {
		phone: visible(''),
		tablet: visible('md'),
		desktop: visible('lg'),
	}
}

// The display class the element shows with, first one that is not hidden
const shownDisplay = (classes: string) =>
	splitClasses(classes)
		.map(parseClass)
		.find(
			(token) =>
				token.utility !== 'hidden' &&
				groupOf(token.utility) === 'display'
		)?.utility ?? 'block'

// Rewrites display classes at base, md and lg to show or hide per device with the fewest classes
export const setVisibility = (classes: string, visible: Visibility) => {
	const fallback = shownDisplay(classes)
	let next = classes
	let carried = fallback
	let previous: string | null = null
	const emitted: [Breakpoint, string][] = []
	for (const { device, breakpoint } of DEVICES) {
		const own = getUtility(classes, 'display', breakpoint)
		if (own && own !== 'hidden') carried = own
		const want = visible[device] ? carried : 'hidden'
		const needed = previous === null ? want !== 'block' : want !== previous
		if (needed) emitted.push([breakpoint, want])
		previous = want
	}
	for (const { breakpoint } of DEVICES) {
		next = setUtility(next, 'display', breakpoint, null)
	}
	for (const [breakpoint, utility] of emitted) {
		next = setUtility(next, 'display', breakpoint, utility)
	}
	return next
}
