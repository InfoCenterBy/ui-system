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
				onPick={(path) => setAttribute(node.id, 'src', path)}
			/>
			<Field label={t('props.url')}>
				<Input
					value={src}
					placeholder='https://'
					onChange={(e) =>
						setAttribute(node.id, 'src', e.target.value)
					}
				/>
			</Field>
			<Field label={t('image.alt')}>
				<Input
					value={node.attrs.alt ?? ''}
					onChange={(e) =>
						setAttribute(node.id, 'alt', e.target.value)
					}
				/>
			</Field>
		</div>
	)
}
