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
import { copySelected, pasteClip } from '@/store/clipboardActions'
import { useDocument } from '@/store/document'
import { useTranslation } from 'react-i18next'
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
	const { t } = useTranslation()
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
		const name = window.prompt(
			t('row.saveAsPrompt'),
			node ? labelOf(node) : ''
		)
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
					aria-label={t('row.actions')}
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
							{t('row.editComponent')}
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => detachRow(id)}>
							{t('row.detach')}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuItem
					onSelect={() => {
						useProject.getState().select(id)
						copySelected()
					}}
				>
					{t('speed.copy')}
				</DropdownMenuItem>
				<DropdownMenuItem
					onSelect={() => {
						useProject.getState().select(id)
						void pasteClip()
					}}
				>
					{t('speed.paste')}
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!free}
					onSelect={() => duplicateSection(id)}
				>
					{t('common.duplicate')}
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!free}
					onSelect={() => wrapNode(id)}
				>
					{t('row.wrap')}
				</DropdownMenuItem>
				{canCreate && (
					<DropdownMenuItem onSelect={create}>
						{t('row.saveAs')}
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onSelect={selectParent}>
					{t('row.selectParent')}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant='destructive'
					disabled={
						!free || (editing && roots.some((r) => r.id === id))
					}
					onSelect={() => deleteNode(id)}
				>
					{t('common.delete')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
