import { ArrowDownIcon, ArrowUpIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { isElement, walk, type ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { addItem, removeItem, shiftItem } from '@/store/actions'
import { carouselOf } from '@/store/carousel'
import { useRoots } from '@/editor/canvas/useRoots'
import { useProject } from '@/store/project'

// Groups of repeat items among the children, in order of appearance
const repeatGroups = (parent: ElementNode) => {
	const groups = new Map<string, ElementNode[]>()
	for (const child of parent.children) {
		if (!isElement(child) || !child.repeat) continue
		groups.set(child.repeat, [...(groups.get(child.repeat) ?? []), child])
	}
	return [...groups.values()]
}

// First text of an item, used as its row label
const firstText = (item: ElementNode) => {
	let found = ''
	walk(item.children, (node) => {
		if (found) return false
		if (node.type === 'text' && node.text.trim()) {
			found = node.text.trim().replace(/\s+/g, ' ')
		}
	})
	return found
}

// Items of a repeat group listed on their parent, so they can be edited without hunting on the canvas
export function RepeatItems({ parent }: { parent: ElementNode }) {
	const { t } = useTranslation()
	const roots = useRoots()
	const selectedId = useProject((s) => s.selectedId)
	const select = useProject((s) => s.select)
	// Carousels have their own slide list
	if (carouselOf(roots, parent.id)) return null
	const groups = repeatGroups(parent)
	if (groups.length === 0) return null
	return (
		<>
			{groups.map((items) => (
				<section key={items[0].repeat} className='flex flex-col gap-2'>
					<h3 className='text-xs font-medium'>
						{t('repeat.items', { count: items.length })}
					</h3>
					<ul className='flex flex-col gap-1'>
						{items.map((item, i) => (
							<li
								key={item.id}
								className={`flex items-center gap-1 rounded-md border p-1 ${selectedId === item.id ? 'border-primary' : ''}`}
							>
								<button
									type='button'
									className='min-w-0 flex-1 truncate text-left text-xs'
									onClick={() => select(item.id)}
								>
									{firstText(item) ||
										t('repeat.item', { n: i + 1 })}
								</button>
								<Button
									size='icon-xs'
									variant='ghost'
									title={t('common.moveUp')}
									aria-label={t('common.moveUp')}
									disabled={i === 0}
									onClick={() => shiftItem(item.id, -1)}
								>
									<ArrowUpIcon />
								</Button>
								<Button
									size='icon-xs'
									variant='ghost'
									title={t('common.moveDown')}
									aria-label={t('common.moveDown')}
									disabled={i === items.length - 1}
									onClick={() => shiftItem(item.id, 1)}
								>
									<ArrowDownIcon />
								</Button>
								<Button
									size='icon-xs'
									variant='ghost'
									title={t('common.duplicate')}
									aria-label={t('common.duplicate')}
									onClick={() => addItem(item.id)}
								>
									<CopyIcon />
								</Button>
								<Button
									size='icon-xs'
									variant='ghost'
									title={t('common.remove')}
									aria-label={t('common.remove')}
									disabled={items.length <= 1}
									onClick={() => removeItem(item.id)}
								>
									<Trash2Icon />
								</Button>
							</li>
						))}
					</ul>
					<Button
						size='sm'
						variant='outline'
						className='w-fit'
						onClick={() => addItem(items[items.length - 1].id)}
					>
						<CopyIcon /> {t('repeat.add')}
					</Button>
				</section>
			))}
		</>
	)
}
