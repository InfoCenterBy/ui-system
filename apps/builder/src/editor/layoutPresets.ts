export interface LayoutVariant {
	id: string
	title: string
	html: string
}

export interface LayoutComponent {
	slug: string
	name: string
	variants: LayoutVariant[]
}

const grid = (n: number): LayoutVariant => ({
	id: `layout/grid-${n}`,
	title: `${n} columns`,
	html: `<div class="grid grid-cols-1 gap-6 md:grid-cols-${n}" data-label="Grid"></div>`,
})

// Builder-side containers shown first in the Elements tab
export const LAYOUT_COMPONENTS: LayoutComponent[] = [
	{
		slug: 'layout-row',
		name: 'Row',
		variants: [
			{
				id: 'layout/row',
				title: 'Row',
				html: '<div class="flex flex-wrap gap-4" data-label="Row"></div>',
			},
		],
	},
	{
		slug: 'layout-stack',
		name: 'Stack',
		variants: [
			{
				id: 'layout/stack',
				title: 'Stack',
				html: '<div class="flex flex-col gap-4" data-label="Stack"></div>',
			},
		],
	},
	{
		slug: 'layout-grid',
		name: 'Grid',
		variants: [
			grid(2),
			grid(3),
			grid(4),
			{
				id: 'layout/grid-12',
				title: '12-column row',
				html: '<div class="grid grid-cols-12 gap-6" data-label="Grid"></div>',
			},
		],
	},
	{
		slug: 'layout-box',
		name: 'Box',
		variants: [
			{
				id: 'layout/box',
				title: 'Box',
				html: '<div data-label="Box"></div>',
			},
		],
	},
]

// Empty elements with these labels show an "add elements" hint on the canvas
export const EMPTY_HINT_LABELS = [
	'Content',
	...LAYOUT_COMPONENTS.map((c) => c.name),
]
