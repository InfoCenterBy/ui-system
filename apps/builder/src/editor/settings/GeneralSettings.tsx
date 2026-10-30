import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { useDocument } from '@/store/document'
import { updateSite } from '@/store/pageActions'

const LANGS = ['ru', 'en', 'be', 'uk', 'kk', 'de']
const OTHER = 'other'

export function GeneralSettings() {
	const site = useDocument((s) => s.doc?.site)
	const [other, setOther] = useState(
		() => !!site && !LANGS.includes(site.lang)
	)
	if (!site) return null
	const selected = other ? OTHER : site.lang

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
		</div>
	)
}
