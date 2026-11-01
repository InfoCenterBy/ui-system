import { resolveLayout, type HeaderPosition } from '@ui-system/core'
import { Switch } from '@/components/ui/switch'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { type Key } from '@/i18n'
import { useTranslation } from 'react-i18next'
import { useDocument } from '@/store/document'
import { updateSite } from '@/store/pageActions'

const HEADER_OPTIONS: {
	value: HeaderPosition
	label: Key
	hint: Key
}[] = [
	{ value: 'static', label: 'header.static', hint: 'header.staticHint' },
	{ value: 'sticky', label: 'header.sticky', hint: 'header.stickyHint' },
	{ value: 'fixed', label: 'header.fixed', hint: 'header.fixedHint' },
	{
		value: 'autohide',
		label: 'header.autohide',
		hint: 'header.autohideHint',
	},
]

// Site-wide, stored in site.layout and applied to the canvas and the export
export function HeaderPositionField() {
	const { t } = useTranslation()
	const layout = useDocument((s) => s.doc?.site.layout)
	const resolved = resolveLayout(layout)
	const option = HEADER_OPTIONS.find((o) => o.value === resolved.header)
	return (
		<Field label={t('header.position')}>
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
						{t(o.label)}
					</option>
				))}
			</NativeSelect>
			<span className='text-muted-foreground text-xs'>
				{option && t(option.hint)}
			</span>
		</Field>
	)
}

export function FooterPositionField() {
	const { t } = useTranslation()
	const layout = useDocument((s) => s.doc?.site.layout)
	const resolved = resolveLayout(layout)
	return (
		<div className='flex items-start justify-between gap-4 text-sm'>
			<label htmlFor='sticky-footer' className='flex flex-col gap-1'>
				{t('footer.sticky')}
				<span className='text-muted-foreground text-xs'>
					{t('footer.stickyHint')}
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
