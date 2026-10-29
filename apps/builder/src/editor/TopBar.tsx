import { useState } from 'react'
import { ChevronDownIcon, Redo2Icon, Undo2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { PageSettings } from '@/editor/settings/PageSettings'
import { SiteSettingsDialog } from '@/editor/settings/SiteSettingsDialog'
import { saveKeys } from '@/store/autosave'
import { useDocument, type SaveState } from '@/store/document'
import { CANVAS_WIDTHS, useProject } from '@/store/project'

const SAVE_LABEL: Record<SaveState, string> = {
	saved: 'Saved',
	unsaved: 'Unsaved changes',
	saving: 'Saving…',
	error: 'Save failed, retrying on next edit',
}

export function TopBar() {
	const site = useDocument((s) => s.doc?.site)
	const pagesById = useDocument((s) => s.doc?.pages)
	const saveState = useDocument((s) => s.saveState)
	const canUndo = useDocument((s) => s.past.length > 0)
	const canRedo = useDocument((s) => s.future.length > 0)
	const currentPageId = useProject((s) => s.currentPageId)
	const canvasWidth = useProject((s) => s.canvasWidth)
	const pages = (site?.pages ?? [])
		.map((id) => pagesById?.[id])
		.filter((p) => p !== undefined)
	const setCurrentPage = useProject((s) => s.setCurrentPage)
	const setCanvasWidth = useProject((s) => s.setCanvasWidth)
	const closeProject = useProject((s) => s.closeProject)
	const page = pages.find((p) => p.id === currentPageId)
	const [pageSettings, setPageSettings] = useState(false)

	async function close() {
		try {
			// Pending edits are written before the project closes
			const state = useDocument.getState()
			if (state.doc && state.dirty.size) {
				const keys = state.takeDirty()
				await saveKeys(state.doc, keys)
				state.finishSave(keys, true)
			}
			await api.close()
			closeProject()
		} catch (e) {
			toast.error((e as Error).message)
		}
	}

	return (
		<header className='flex h-12 shrink-0 items-center gap-3 border-b px-3'>
			<span className='text-sm font-semibold'>{site?.name}</span>
			<Separator orientation='vertical' className='h-5' />

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline' size='sm'>
						{page?.name ?? 'No page'}
						<ChevronDownIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start'>
					{pages.map((p) => (
						<DropdownMenuItem
							key={p.id}
							onSelect={() => setCurrentPage(p.id)}
						>
							{p.name}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={!page}
						onSelect={() => setPageSettings(true)}
					>
						Page settings…
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<PageSettings
				pageId={currentPageId}
				open={pageSettings}
				onOpenChange={setPageSettings}
			/>

			<div className='mx-auto flex gap-1'>
				{CANVAS_WIDTHS.map(({ label, width }) => (
					<Button
						key={width}
						size='sm'
						variant={canvasWidth === width ? 'secondary' : 'ghost'}
						onClick={() => setCanvasWidth(width)}
					>
						{label} {width}
					</Button>
				))}
			</div>

			<div className='flex gap-1'>
				<Button
					size='icon-sm'
					variant='ghost'
					aria-label='Undo'
					title='Undo (Ctrl+Z)'
					disabled={!canUndo}
					onClick={() => useDocument.getState().undo()}
				>
					<Undo2Icon />
				</Button>
				<Button
					size='icon-sm'
					variant='ghost'
					aria-label='Redo'
					title='Redo (Ctrl+Y)'
					disabled={!canRedo}
					onClick={() => useDocument.getState().redo()}
				>
					<Redo2Icon />
				</Button>
			</div>
			<span
				className={
					saveState === 'error'
						? 'text-destructive text-xs'
						: 'text-muted-foreground text-xs'
				}
			>
				{SAVE_LABEL[saveState]}
			</span>
			<SiteSettingsDialog />
			<Button variant='outline' size='sm' onClick={() => void close()}>
				Close project
			</Button>
		</header>
	)
}
