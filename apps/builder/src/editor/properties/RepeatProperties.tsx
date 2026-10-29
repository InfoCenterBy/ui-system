import { ArrowDownIcon, ArrowUpIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { repeatItems, type ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { addItem, removeItem, shiftItem } from '@/store/actions'
import { useRoots } from '@/editor/canvas/useRoots'

export function RepeatProperties({ item }: { item: ElementNode }) {
	const items = repeatItems(useRoots(), item.id)
	const position = items.findIndex((i) => i.id === item.id)
	if (position < 0) return null
	return (
		<div className='flex flex-col gap-2'>
			<p className='text-sm font-medium'>
				Item {position + 1} of {items.length}
			</p>
			<div className='flex flex-wrap gap-1'>
				<Button
					size='sm'
					variant='outline'
					onClick={() => addItem(item.id)}
				>
					<CopyIcon /> Add item
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={position === 0}
					onClick={() => shiftItem(item.id, -1)}
				>
					<ArrowUpIcon /> Move up
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={position === items.length - 1}
					onClick={() => shiftItem(item.id, 1)}
				>
					<ArrowDownIcon /> Move down
				</Button>
				<Button
					size='sm'
					variant='outline'
					disabled={items.length <= 1}
					onClick={() => removeItem(item.id)}
				>
					<Trash2Icon /> Remove
				</Button>
			</div>
		</div>
	)
}
