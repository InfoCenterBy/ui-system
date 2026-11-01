import type { ElementNode } from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { Field } from '@/editor/properties/Field'
import { useTranslation } from 'react-i18next'
import { setAttribute } from '@/store/actions'

export const COUNTDOWN_ATTR = 'data-countdown-to'

// Date the countdown runs to, the exported page counts the time left
export function CountdownProperties({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	return (
		<div className='flex flex-col gap-1.5'>
			<Field label={t('countdown.to')}>
				<Input
					type='datetime-local'
					value={node.attrs[COUNTDOWN_ATTR] ?? ''}
					onChange={(e) =>
						setAttribute(node.id, COUNTDOWN_ATTR, e.target.value)
					}
				/>
			</Field>
			<p className='text-muted-foreground text-xs'>
				{t('countdown.hint')}
			</p>
		</div>
	)
}
