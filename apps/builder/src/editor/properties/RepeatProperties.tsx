import { ArrowDownIcon, ArrowUpIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { repeatItems, type ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { addItem, removeItem, shiftItem } from '@/store/actions'
import { useRoots } from '@/editor/canvas/useRoots'
import { useTranslation } from 'react-i18next'

export function RepeatProperties({ item }: { item: ElementNode }) {
	const { t } = useTranslation()
	const items = repeatItems(useRoots(), item.id)
	const position = items.findIndex((i) => i.id === item.id)
	if (position < 0) return null
	return (
		<div className='flex flex-col gap-2'>
			<p className='text-sm font-medium'>
				{t('repeat.position', {
					n: position + 1,
					total: items.length,
				})}
			</p>
			<div className='flex flex-wrap gap-1'>
				<Button
					size='sm'
					variant='outline'
					onClick={() => addItem(item.id)}
				>
					<CopyIcon /> {t('repeat.add')}
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={position === 0}
					onClick={() => shiftItem(item.id, -1)}
				>
					<ArrowUpIcon /> {t('common.moveUp')}
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={position === items.length - 1}
					onClick={() => shiftItem(item.id, 1)}
				>
					<ArrowDownIcon /> {t('common.moveDown')}
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={items.length <= 1}
					onClick={() => removeItem(item.id)}
				>
					<Trash2Icon /> {t('common.remove')}
				</Button>
			</div>
		</div>
	)
}
