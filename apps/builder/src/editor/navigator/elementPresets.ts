export interface ElementPreset {
	id: string
	label: string
	html: string
}

export const ELEMENT_PRESETS: ElementPreset[] = [
	{
		id: 'container',
		label: 'Container',
		html: '<div class="flex flex-col gap-4 p-4"></div>',
	},
	{
		id: 'heading',
		label: 'Heading',
		html: '<h2 class="text-2xl font-bold">Heading</h2>',
	},
	{
		id: 'paragraph',
		label: 'Paragraph',
		html: '<p>Write your text here.</p>',
	},
	{
		id: 'image',
		label: 'Image',
		html: '<img src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp" alt="Image">',
	},
	{
		id: 'link',
		label: 'Link',
		html: '<a class="link" href="#">Link</a>',
	},
	{
		id: 'button',
		label: 'Button',
		html: '<a class="btn btn-primary" href="#">Button</a>',
	},
	{
		id: 'list',
		label: 'List',
		html: '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>',
	},
	{
		id: 'card',
		label: 'Card',
		html: '<div class="card bg-base-100 shadow-sm"><div class="card-body"><h2 class="card-title">Card title</h2><p>Card description goes here.</p></div></div>',
	},
	{
		id: 'grid',
		label: 'Grid',
		html: '<div class="grid md:grid-cols-3 gap-6"><div>Column 1</div><div>Column 2</div><div>Column 3</div></div>',
	},
	{
		id: 'divider',
		label: 'Divider',
		html: '<div class="divider"></div>',
	},
]
