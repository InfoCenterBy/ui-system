import { useState } from 'react'
import { resolveLayout, type HeaderPosition } from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { useDocument } from '@/store/document'
import { updateSite } from '@/store/pageActions'

const LANGS = ['ru', 'en', 'be', 'uk', 'kk', 'de']
const OTHER = 'other'

const HEADER_OPTIONS: { value: HeaderPosition; label: string; hint: string }[] =
	[
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

export function GeneralSettings() {
	const site = useDocument((s) => s.doc?.site)
	const [other, setOther] = useState(
		() => !!site && !LANGS.includes(site.lang)
	)
	if (!site) return null
	const selected = other ? OTHER : site.lang
	const layout = resolveLayout(site.layout)
	const position = HEADER_OPTIONS.find((o) => o.value === layout.header)

	return (
		<div className='flex max-w-md flex-col gap-4 p-2'>
			<Field label='Site name'>
				<Input
					value={site.name}
					onChange={(e) => updateSite({ name: e.target.value })}
				/>
			</Field>
			<Field label='Language (html lang attribute)'>
				<NativeSelect
					value={selected}
					onChange={(e) => {
						if (e.target.value === OTHER) setOther(true)
						else {
							setOther(false)
							updateSite({ lang: e.target.value })
						}
					}}
				>
					{LANGS.map((l) => (
						<option key={l} value={l}>
							{l}
						</option>
					))}
					<option value={OTHER}>other…</option>
				</NativeSelect>
			</Field>
			{other && (
				<Field label='Language code'>
					<Input
						value={site.lang}
						placeholder='e.g. fr'
						onChange={(e) =>
							updateSite({ lang: e.target.value.trim() })
						}
					/>
				</Field>
			)}
			<Field label='Asset path prefix'>
				<Input
					value={site.pathPrefix}
					placeholder='/local/templates/site/'
					onChange={(e) => updateSite({ pathPrefix: e.target.value })}
				/>
				<span className='text-muted-foreground text-xs'>
					Empty means relative paths like assets/x.png. For Bitrix put
					the template path, e.g. /local/templates/site/
				</span>
			</Field>
			<Field label='Header position'>
				<NativeSelect
					value={layout.header}
					onChange={(e) =>
						updateSite({
							layout: {
								...site.layout,
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
					{position?.hint}
				</span>
			</Field>
			<div className='flex items-start justify-between gap-4 text-sm'>
				<label htmlFor='sticky-footer' className='flex flex-col gap-1'>
					Footer sticks to the bottom
					<span className='text-muted-foreground text-xs'>
						On short pages the footer stays at the bottom of the
						window instead of right after the content.
					</span>
				</label>
				<Switch
					id='sticky-footer'
					checked={layout.stickyFooter}
					onCheckedChange={(checked) =>
						updateSite({
							layout: { ...site.layout, stickyFooter: checked },
						})
					}
				/>
			</div>
		</div>
	)
}
