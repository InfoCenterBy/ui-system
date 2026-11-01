import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { useDocument } from '@/store/document'
import { updateSite } from '@/store/pageActions'
import { useTranslation } from 'react-i18next'

const LANGS = ['ru', 'en', 'be', 'uk', 'kk', 'de']
const OTHER = 'other'

export function GeneralSettings() {
	const { t } = useTranslation()
	const site = useDocument((s) => s.doc?.site)
	const [other, setOther] = useState(
		() => !!site && !LANGS.includes(site.lang)
	)
	if (!site) return null
	const selected = other ? OTHER : site.lang

	return (
		<div className='flex max-w-md flex-col gap-4 p-2'>
			<Field label={t('settings.siteName')}>
				<Input
					value={site.name}
					onChange={(e) => updateSite({ name: e.target.value })}
				/>
			</Field>
			<Field label={t('settings.lang')}>
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
					<option value={OTHER}>{t('settings.langOther')}</option>
				</NativeSelect>
			</Field>
			{other && (
				<Field label={t('settings.langCode')}>
					<Input
						value={site.lang}
						placeholder={t('settings.langExample')}
						onChange={(e) =>
							updateSite({ lang: e.target.value.trim() })
						}
					/>
				</Field>
			)}
			<Field label={t('settings.prefix')}>
				<Input
					value={site.pathPrefix}
					placeholder='/local/templates/site/'
					onChange={(e) => updateSite({ pathPrefix: e.target.value })}
				/>
				<span className='text-muted-foreground text-xs'>
					{t('settings.prefixHint')}
				</span>
			</Field>
		</div>
	)
}
