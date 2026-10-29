import { MoreHorizontal } from 'lucide-react'
import { ancestorsOf } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteNode, duplicateSection, wrapNode } from '@/store/actions'
import { useProject } from '@/store/project'
import { currentSections } from './dragHelpers'

interface Props {
	id: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function RowMenu({ id, open, onOpenChange }: Props) {
	const selectParent = () => {
		const parent = ancestorsOf(currentSections(), id).at(-1)
		if (parent) useProject.getState().select(parent.id)
	}
	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger asChild>
				<Button
					variant='ghost'
					size='icon-xs'
					aria-label='Element actions'
					className={
						open ? '' : 'opacity-0 group-hover/row:opacity-100'
					}
				>
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem onSelect={() => duplicateSection(id)}>
					Duplicate
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => wrapNode(id)}>
					Wrap in container
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={selectParent}>
					Select parent
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant='destructive'
					onSelect={() => deleteNode(id)}
				>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
