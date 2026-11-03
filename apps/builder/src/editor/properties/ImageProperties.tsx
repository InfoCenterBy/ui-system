import { useState } from 'react'
import type { ElementNode } from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { AssetPicker } from '@/editor/properties/AssetPicker'
import { assetUrl } from '@/editor/properties/assetUrl'
import { Field } from '@/editor/properties/Field'
import { useTranslation } from 'react-i18next'
import { setAttribute } from '@/store/actions'

export function ImageProperties({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const src = node.attrs.src ?? ''
	// Id of the image whose picture changed while its description did not
	const [stale, setStale] = useState<string | null>(null)
	const replace = (value: string) => {
		setStale(node.id)
		setAttribute(node.id, 'src', value)
	}
	const needsAlt = stale === node.id && Boolean(node.attrs.alt)
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
			<AssetPicker value={src} onPick={replace} />
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
					className={needsAlt ? 'border-amber-500' : undefined}
					onChange={(e) => {
						setStale(null)
						setAttribute(node.id, 'alt', e.target.value)
					}}
				/>
				{needsAlt && (
					<p className='text-xs text-amber-600 dark:text-amber-400'>
						{t('imageAlt.stale')}
					</p>
				)}
			</Field>
		</div>
	)
}
