import { resolveLayout, type HeaderPosition } from '@ui-system/core'
import { Switch } from '@/components/ui/switch'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { useDocument } from '@/store/document'
import { updateSite } from '@/store/pageActions'

const HEADER_OPTIONS: {
	value: HeaderPosition
	label: string
	hint: string
}[] = [
	{
		value: 'static',
		label: 'Static',
		hint: 'The header scrolls away with the page.',
	},
	{
		value: 'sticky',
		label: 'Sticky',
		hint: 'The header stays at the top while scrolling.',
	},
	{
		value: 'fixed',
		label: 'Fixed (over content)',
		hint: 'The header floats over the first section, good for a transparent header on a hero.',
	},
	{
		value: 'autohide',
		label: 'Hide on scroll down',
		hint: 'Sticky, but slides out when scrolling down and returns when scrolling up.',
	},
]

// Site-wide, stored in site.layout and applied to the canvas and the export
export function HeaderPositionField() {
	const layout = useDocument((s) => s.doc?.site.layout)
	const resolved = resolveLayout(layout)
	const option = HEADER_OPTIONS.find((o) => o.value === resolved.header)
	return (
		<Field label='Position'>
			<NativeSelect
				value={resolved.header}
				onChange={(e) =>
					updateSite({
						layout: {
							...layout,
							header: e.target.value as HeaderPosition,
						},
					})
				}
			>
				{HEADER_OPTIONS.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</NativeSelect>
			<span className='text-muted-foreground text-xs'>
				{option?.hint}
			</span>
		</Field>
	)
}

export function FooterPositionField() {
	const layout = useDocument((s) => s.doc?.site.layout)
	const resolved = resolveLayout(layout)
	return (
		<div className='flex items-start justify-between gap-4 text-sm'>
			<label htmlFor='sticky-footer' className='flex flex-col gap-1'>
				Stick to the bottom of short pages
				<span className='text-muted-foreground text-xs'>
					On short pages the footer stays at the bottom of the window
					instead of right after the content.
				</span>
			</label>
			<Switch
				id='sticky-footer'
				checked={resolved.stickyFooter}
				onCheckedChange={(checked) =>
					updateSite({ layout: { ...layout, stickyFooter: checked } })
				}
			/>
		</div>
	)
}
