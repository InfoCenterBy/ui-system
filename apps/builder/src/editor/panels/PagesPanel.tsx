import { useState } from 'react'
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CopyIcon,
	HomeIcon,
	MoreHorizontalIcon,
	PlusIcon,
	SettingsIcon,
	Trash2Icon,
} from 'lucide-react'
import type { Page } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { PageSettings } from '@/editor/settings/PageSettings'
import { useDocument } from '@/store/document'
import {
	HOME_SLUG,
	addPage,
	deletePage,
	duplicatePage,
	movePage,
	renamePage,
	setHomePage,
} from '@/store/pageActions'
import { useProject } from '@/store/project'

interface RowProps {
	page: Page
	index: number
	last: boolean
	onSettings: () => void
	onDelete: () => void
}

function PageRow({ page, index, last, onSettings, onDelete }: RowProps) {
	const current = useProject((s) => s.currentPageId === page.id)
	const setCurrentPage = useProject((s) => s.setCurrentPage)
	const [editing, setEditing] = useState(false)
	const home = page.slug === HOME_SLUG

	const finish = (value: string) => {
		setEditing(false)
		if (value.trim() && value !== page.name) renamePage(page.id, value)
	}

	return (
		<div
			className={`group flex h-8 items-center gap-1.5 rounded-md pl-2 text-sm ${
				current ? 'bg-accent' : 'hover:bg-accent/50'
			}`}
		>
			{home && (
				<HomeIcon className='text-muted-foreground size-3.5 shrink-0' />
			)}
			{editing ? (
				<Input
					autoFocus
					defaultValue={page.name}
					className='h-6 flex-1'
					onBlur={(e) => finish(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') finish(e.currentTarget.value)
						if (e.key === 'Escape') setEditing(false)
					}}
				/>
			) : (
				<button
					type='button'
					className='min-w-0 flex-1 truncate text-left'
					onClick={() => setCurrentPage(page.id)}
					onDoubleClick={() => setEditing(true)}
				>
					{page.name}
				</button>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						size='icon-sm'
						variant='ghost'
						aria-label={`Actions for ${page.name}`}
					>
						<MoreHorizontalIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem onSelect={onSettings}>
						<SettingsIcon /> Settings
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => duplicatePage(page.id)}>
						<CopyIcon /> Duplicate
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={home}
						onSelect={() => setHomePage(page.id)}
					>
						<HomeIcon /> Set as home
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={index === 0}
						onSelect={() => movePage(page.id, index - 1)}
					>
						<ArrowUpIcon /> Move up
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={last}
						onSelect={() => movePage(page.id, index + 1)}
					>
						<ArrowDownIcon /> Move down
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant='destructive'
						disabled={home}
						onSelect={onDelete}
					>
						<Trash2Icon /> Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

function AddPage() {
	const [adding, setAdding] = useState(false)
	const [name, setName] = useState('')

	const close = () => {
		setAdding(false)
		setName('')
	}

	if (!adding)
		return (
			<Button variant='outline' size='sm' onClick={() => setAdding(true)}>
				<PlusIcon /> Add page
			</Button>
		)
	return (
		<Input
			autoFocus
			value={name}
			placeholder='Page name, Enter to create'
			onChange={(e) => setName(e.target.value)}
			onBlur={close}
			onKeyDown={(e) => {
				if (e.key === 'Escape') close()
				if (e.key === 'Enter' && name.trim()) {
					addPage(name)
					close()
				}
			}}
		/>
	)
}

export function PagesPanel() {
	const site = useDocument((s) => s.doc?.site)
	const byId = useDocument((s) => s.doc?.pages)
	const [settingsId, setSettingsId] = useState<string | null>(null)
	const [settingsOpen, setSettingsOpen] = useState(false)
	const [deleting, setDeleting] = useState<Page | null>(null)
	const pages = (site?.pages ?? [])
		.map((id) => byId?.[id])
		.filter((p) => p !== undefined)

	return (
		<div className='flex flex-col gap-2 p-2'>
			<div className='flex flex-col gap-0.5'>
				{pages.map((page, i) => (
					<PageRow
						key={page.id}
						page={page}
						index={i}
						last={i === pages.length - 1}
						onSettings={() => {
							setSettingsId(page.id)
							setSettingsOpen(true)
						}}
						onDelete={() => setDeleting(page)}
					/>
				))}
			</div>
			<AddPage />
			<PageSettings
				pageId={settingsId}
				open={settingsOpen}
				onOpenChange={setSettingsOpen}
			/>
			<Dialog
				open={deleting !== null}
				onOpenChange={(open) => !open && setDeleting(null)}
			>
				<DialogContent className='sm:max-w-sm'>
					<DialogHeader>
						<DialogTitle>Delete page?</DialogTitle>
						<DialogDescription>
							&quot;{deleting?.name}&quot; and its file will be
							removed. You can undo this right after.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setDeleting(null)}
						>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={() => {
								if (deleting) deletePage(deleting.id)
								setDeleting(null)
							}}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
