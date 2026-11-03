import { parseClass, splitClasses } from '@ui-system/core'

export interface ComponentOption {
	id: string
	// Full class names, at most one is active
	values: string[]
	// Single-value options are toggles, the empty value switches them off
	allowNone?: boolean
}

export interface ComponentOptions {
	component: string
	options: ComponentOption[]
}

const COLORS = [
	'neutral',
	'primary',
	'secondary',
	'accent',
	'info',
	'success',
	'warning',
	'error',
]
const STATUS_COLORS = ['info', 'success', 'warning', 'error']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']

const choice = (
	id: string,
	prefix: string,
	names: string[]
): ComponentOption => ({ id, values: names.map((n) => `${prefix}-${n}`) })
const color = (prefix: string, names = COLORS) => choice('color', prefix, names)
const size = (prefix: string) => choice('size', prefix, SIZES)
const toggle = (id: string, value: string): ComponentOption => ({
	id,
	values: [value],
	allowNone: true,
})
const field = (component: string, ghost = true): ComponentOptions => ({
	component,
	options: [
		color(component),
		size(component),
		...(ghost ? [choice('style', component, ['ghost'])] : []),
	],
})

const MASKS = [
	'squircle',
	'heart',
	'hexagon',
	'hexagon-2',
	'decagon',
	'pentagon',
	'diamond',
	'circle',
	'star',
	'star-2',
	'triangle',
	'triangle-2',
	'triangle-3',
	'triangle-4',
	'half-1',
	'half-2',
]

export const componentOptions: ComponentOptions[] = [
	{
		component: 'btn',
		options: [
			color('btn'),
			choice('style', 'btn', [
				'outline',
				'dash',
				'soft',
				'ghost',
				'link',
			]),
			size('btn'),
			choice('shape', 'btn', ['wide', 'block', 'square', 'circle']),
			toggle('state', 'btn-active'),
		],
	},
	{
		component: 'badge',
		options: [
			color('badge'),
			choice('style', 'badge', ['outline', 'dash', 'soft', 'ghost']),
			size('badge'),
		],
	},
	{
		component: 'alert',
		options: [
			color('alert', STATUS_COLORS),
			choice('style', 'alert', ['outline', 'dash', 'soft']),
			choice('direction', 'alert', ['vertical', 'horizontal']),
		],
	},
	{
		component: 'loading',
		options: [
			choice('type', 'loading', [
				'spinner',
				'dots',
				'ring',
				'ball',
				'bars',
				'infinity',
			]),
			size('loading'),
			color('text'),
		],
	},
	{
		component: 'tooltip',
		options: [
			choice('position', 'tooltip', ['top', 'bottom', 'left', 'right']),
			// daisyUI has no tooltip-neutral
			color(
				'tooltip',
				COLORS.filter((c) => c !== 'neutral')
			),
			toggle('open', 'tooltip-open'),
		],
	},
	{ component: 'status', options: [color('status'), size('status')] },
	{
		component: 'link',
		options: [color('link'), toggle('hover', 'link-hover')],
	},
	{ component: 'progress', options: [color('progress')] },
	{ component: 'kbd', options: [size('kbd')] },
	field('input'),
	field('select'),
	field('textarea'),
	field('file-input'),
	field('checkbox', false),
	field('radio', false),
	field('toggle', false),
	field('range', false),
	{
		component: 'divider',
		options: [
			color('divider'),
			choice('direction', 'divider', ['horizontal', 'vertical']),
			choice('position', 'divider', ['start', 'end']),
		],
	},
	{
		component: 'card',
		options: [
			choice('style', 'card', ['border', 'dash']),
			size('card'),
			toggle('layout', 'card-side'),
		],
	},
	{
		component: 'menu',
		options: [
			size('menu'),
			choice('direction', 'menu', ['horizontal', 'vertical']),
		],
	},
	{
		component: 'tabs',
		options: [
			choice('style', 'tabs', ['box', 'border', 'lift']),
			size('tabs'),
			choice('placement', 'tabs', ['top', 'bottom']),
		],
	},
	{
		component: 'dropdown',
		options: [
			choice('position', 'dropdown', ['top', 'bottom', 'left', 'right']),
			choice('align', 'dropdown', ['start', 'center', 'end']),
			toggle('hover', 'dropdown-hover'),
			toggle('open', 'dropdown-open'),
		],
	},
	{
		component: 'steps',
		options: [choice('direction', 'steps', ['horizontal', 'vertical'])],
	},
	{ component: 'step', options: [color('step')] },
	{
		component: 'chat',
		options: [choice('placement', 'chat', ['start', 'end'])],
	},
	{ component: 'chat-bubble', options: [color('chat-bubble')] },
	{
		component: 'collapse',
		options: [choice('icon', 'collapse', ['arrow', 'plus'])],
	},
	{
		component: 'modal',
		options: [
			choice('placement', 'modal', [
				'top',
				'middle',
				'bottom',
				'start',
				'end',
			]),
		],
	},
	{
		component: 'stack',
		options: [
			choice('direction', 'stack', ['top', 'bottom', 'start', 'end']),
		],
	},
	{
		component: 'join',
		options: [choice('direction', 'join', ['vertical', 'horizontal'])],
	},
	{
		component: 'timeline',
		options: [
			choice('direction', 'timeline', ['vertical', 'horizontal']),
			toggle('compact', 'timeline-compact'),
		],
	},
	{
		component: 'table',
		options: [
			size('table'),
			toggle('zebra', 'table-zebra'),
			toggle('pinRows', 'table-pin-rows'),
			toggle('pinCols', 'table-pin-cols'),
		],
	},
	{
		component: 'stats',
		options: [choice('direction', 'stats', ['horizontal', 'vertical'])],
	},
	{ component: 'mask', options: [choice('shape', 'mask', MASKS)] },
	{
		component: 'indicator-item',
		options: [
			choice('horizontal', 'indicator', ['start', 'center', 'end']),
			choice('vertical', 'indicator', ['top', 'middle', 'bottom']),
		],
	},
	{
		component: 'swap',
		options: [choice('effect', 'swap', ['rotate', 'flip'])],
	},
	{ component: 'rating', options: [size('rating')] },
	{ component: 'otp', options: [color('otp'), size('otp')] },
]

// Prefixed classes like "md:btn-lg" or "hover:btn-ghost" are other states
const plainClasses = (classes: string) =>
	splitClasses(classes).filter((c) => parseClass(c).variants.length === 0)

export const optionsFor = (classes: string): ComponentOptions[] => {
	const plain = new Set(plainClasses(classes))
	return componentOptions.filter((c) => plain.has(c.component))
}

export const currentOption = (
	classes: string,
	option: ComponentOption
): string | null =>
	plainClasses(classes).find((c) => option.values.includes(c)) ?? null

export const setOption = (
	classes: string,
	option: ComponentOption,
	value: string | null
): string => {
	const values = new Set(option.values)
	const result: string[] = []
	let placed = false
	for (const cls of splitClasses(classes)) {
		if (parseClass(cls).variants.length === 0 && values.has(cls)) {
			if (!placed && value) result.push(value)
			placed = true
			continue
		}
		result.push(cls)
	}
	if (!placed && value) result.push(value)
	return result.join(' ')
}
