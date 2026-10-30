import { MoreHorizontal } from 'lucide-react'
import { ancestorsOf, findElement, hasInstance } from '@ui-system/core'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { scopeOf } from '@/editor/canvas/nodes'
import { useRoots } from '@/editor/canvas/useRoots'
import {
	createComponentFrom,
	deleteNode,
	detach,
	duplicateSection,
	isSharedPart,
	wrapNode,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'
import { labelOf } from '@/editor/canvas/nodes'
import { currentSections } from './dragHelpers'

const detachRow = (id: string) => {
	try {
		detach(id)
	} catch (e) {
		toast.error((e as Error).message)
	}
}

interface Props {
	id: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function RowMenu({ id, open, onOpenChange }: Props) {
	const roots = useRoots()
	const editing = useProject((s) => s.editingComponentId !== null)
	const partials = useDocument((s) => s.doc?.partials)
	const node = findElement(roots, id)
	const free = scopeOf(roots, id, editing) === 'free'
	const canCreate =
		!editing &&
		free &&
		node &&
		!node.instance &&
		!hasInstance(node) &&
		!isSharedPart(partials, id)
	const create = () => {
		const name = window.prompt('Component name', node ? labelOf(node) : '')
		if (!name?.trim()) return
		try {
			createComponentFrom(id, name)
		} catch (e) {
			toast.error((e as Error).message)
		}
	}
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
				{node?.instance && (
					<>
						<DropdownMenuItem
							onSelect={() =>
								useProject
									.getState()
									.editComponent(node.instance!.component)
							}
						>
							Edit component
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => detachRow(id)}>
							Detach
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem
					disabled={!free}
					onSelect={() => duplicateSection(id)}
				>
					Duplicate
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!free}
					onSelect={() => wrapNode(id)}
				>
					Wrap in container
				</DropdownMenuItem>
				{canCreate && (
					<DropdownMenuItem onSelect={create}>
						Create component…
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onSelect={selectParent}>
					Select parent
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant='destructive'
					disabled={!free}
					onSelect={() => deleteNode(id)}
				>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
