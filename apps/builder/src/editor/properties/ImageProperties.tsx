import { useState } from 'react'
import type { ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssetPicker } from '@/editor/properties/AssetPicker'
import { altFromFileName } from '@/editor/properties/altText'
import { assetUrl } from '@/editor/properties/assetUrl'
import { Field } from '@/editor/properties/Field'
import { useTranslation } from 'react-i18next'
import { setAttribute, setImageAlt } from '@/store/actions'

export function ImageProperties({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const src = node.attrs.src ?? ''
	// Id of the image whose picture changed while its description did not
	const [stale, setStale] = useState<string | null>(null)
	const replace = (value: string) => {
		setStale(node.id)
		setAttribute(node.id, 'src', value)
	}
	// Asked right after an upload: describe the new picture or mark it decorative
	const [ask, setAsk] = useState<{ id: string; draft: string } | null>(null)
	const asking = ask?.id === node.id
	const decorative =
		node.attrs.alt === '' && node.attrs.role === 'presentation'
	const needsAlt = stale === node.id && Boolean(node.attrs.alt) && !asking
	const answer = (alt: string, isDecorative: boolean) => {
		setImageAlt(node.id, alt, isDecorative)
		setStale(null)
		setAsk(null)
	}
	return (
		<div className='flex flex-col gap-3'>
			{src && (
				<div className='bg-muted flex h-32 items-center justify-center overflow-hidden rounded-md border'>
					<img
						src={assetUrl(src)}
						alt=''
						className='size-full object-contain'
					/>
				</div>
			)}
			<AssetPicker
				value={src}
				onPick={replace}
				onUploaded={(_, file) =>
					setAsk({ id: node.id, draft: altFromFileName(file.name) })
				}
			/>
			{asking && (
				<div className='flex flex-col gap-2 rounded-md border border-amber-500 p-2'>
					<p className='text-xs'>{t('imageAlt.ask')}</p>
					<Input
						autoFocus
						value={ask.draft}
						placeholder={t('imageAlt.placeholder')}
						onChange={(e) =>
							setAsk({ id: node.id, draft: e.target.value })
						}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && ask.draft.trim()) {
								answer(ask.draft.trim(), false)
							}
						}}
					/>
					<div className='flex flex-wrap gap-1.5'>
						<Button
							size='sm'
							disabled={!ask.draft.trim()}
							onClick={() => answer(ask.draft.trim(), false)}
						>
							{t('imageAlt.save')}
						</Button>
						<Button
							size='sm'
							variant='outline'
							title={t('imageAlt.decorativeHint')}
							onClick={() => answer('', true)}
						>
							{t('imageAlt.decorative')}
						</Button>
						<Button
							size='sm'
							variant='ghost'
							onClick={() => setAsk(null)}
						>
							{t('imageAlt.later')}
						</Button>
					</div>
				</div>
			)}
			<Field label={t('props.url')}>
				<Input
					value={src}
					placeholder='https://'
					onChange={(e) => replace(e.target.value)}
				/>
			</Field>
			<Field label={t('image.alt')}>
				<Input
					value={node.attrs.alt ?? ''}
					disabled={decorative}
					className={needsAlt ? 'border-amber-500' : undefined}
					onChange={(e) => {
						setStale(null)
						setAttribute(node.id, 'alt', e.target.value)
					}}
				/>
				<label
					className='flex items-center gap-1.5 text-xs'
					title={t('imageAlt.decorativeHint')}
				>
					<input
						type='checkbox'
						checked={decorative}
						onChange={(e) => {
							setStale(null)
							setImageAlt(node.id, '', e.target.checked)
						}}
					/>
					{t('imageAlt.decorative')}
				</label>
				{needsAlt && (
					<p className='text-xs text-amber-600 dark:text-amber-400'>
						{t('imageAlt.stale')}
					</p>
				)}
			</Field>
		</div>
	)
}
