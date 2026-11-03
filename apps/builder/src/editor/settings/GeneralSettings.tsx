import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssetPicker } from '@/editor/properties/AssetPicker'
import { assetUrl } from '@/editor/properties/assetUrl'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { CodeFields } from '@/editor/settings/CodeFields'
import { useDocument } from '@/store/document'
import { updateSite } from '@/store/pageActions'
import { useTranslation } from 'react-i18next'

const LANGS = ['ru', 'en', 'be', 'uk', 'kk', 'de'] as const
const OTHER = 'other'

const validUrl = (value: string) => /^https?:\/\/[^\s/]+/i.test(value.trim())

export function GeneralSettings() {
	const { t } = useTranslation()
	const site = useDocument((s) => s.doc?.site)
	const [other, setOther] = useState(
		() => !!site && !(LANGS as readonly string[]).includes(site.lang)
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
							{t(`siteLang.${l}`)} ({l})
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
			<Field label={t('seo.siteUrl')}>
				<Input
					value={site.url ?? ''}
					placeholder='https://example.com'
					aria-invalid={!!site.url && !validUrl(site.url)}
					onChange={(e) => updateSite({ url: e.target.value.trim() })}
				/>
				<span
					className={
						site.url && !validUrl(site.url)
							? 'text-destructive text-xs'
							: 'text-muted-foreground text-xs'
					}
				>
					{site.url && !validUrl(site.url)
						? t('seo.siteUrlInvalid')
						: t('seo.siteUrlHint')}
				</span>
			</Field>
			<div className='flex flex-col gap-1.5 text-sm'>
				<span className='text-muted-foreground text-xs'>
					{t('seo.favicon')}
				</span>
				{site.favicon && (
					<div className='flex items-center gap-2'>
						<img
							src={assetUrl(site.favicon)}
							alt=''
							className='bg-muted size-8 rounded-md object-contain'
						/>
						<span className='min-w-0 flex-1 truncate text-xs'>
							{site.favicon}
						</span>
						<Button
							size='icon-sm'
							variant='ghost'
							aria-label={t('seo.clearFavicon')}
							onClick={() => updateSite({ favicon: null })}
						>
							<XIcon />
						</Button>
					</div>
				)}
				<AssetPicker
					value={site.favicon ?? ''}
					onPick={(path) => updateSite({ favicon: path })}
				/>
			</div>
			<CodeFields
				value={site.code}
				onChange={(code) => updateSite({ code })}
			/>
		</div>
	)
}
