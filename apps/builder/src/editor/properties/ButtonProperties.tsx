import { randomId, type ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/editor/properties/Field'
import {
	canBecomeLink,
	hasPlainText,
	plainText,
} from '@/editor/properties/linkable'
import { LinkProperties } from '@/editor/properties/LinkProperties'
import { convertToLink, setSlotContent } from '@/store/actions'
import { useTranslation } from 'react-i18next'

// Text and link of a free-scope button or anchor
export function ButtonProperties({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const isLink = node.tag.toLowerCase() === 'a'
	const text = hasPlainText(node) ? (
		<Field label={t('linkable.text')}>
			<Input
				value={plainText(node)}
				onChange={(e) =>
					setSlotContent(node.id, [
						{ id: randomId(), type: 'text', text: e.target.value },
					])
				}
			/>
		</Field>
	) : (
		<p className='text-muted-foreground text-xs'>
			{t('linkable.complexText')}
		</p>
	)
	return (
		<div className='flex flex-col gap-3'>
			{text}
			{isLink && <LinkProperties node={node} showText={false} />}
			{!isLink && canBecomeLink(node) && (
				<div className='flex flex-col gap-1.5'>
					<Button
						size='sm'
						variant='outline'
						className='w-fit'
						onClick={() => convertToLink(node.id)}
					>
						{t('linkable.makeLink')}
					</Button>
					<p className='text-muted-foreground text-xs'>
						{t('linkable.makeLinkHint')}
					</p>
				</div>
			)}
		</div>
	)
}
