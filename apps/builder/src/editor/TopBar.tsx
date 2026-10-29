import { ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { CANVAS_WIDTHS, useProject } from '@/store/project'

export function TopBar() {
	const { site, pages, currentPageId, canvasWidth } = useProject()
	const setCurrentPage = useProject((s) => s.setCurrentPage)
	const setCanvasWidth = useProject((s) => s.setCanvasWidth)
	const closeProject = useProject((s) => s.closeProject)
	const page = pages.find((p) => p.id === currentPageId)

	async function close() {
		try {
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
				</DropdownMenuContent>
			</DropdownMenu>

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

			<span className='text-muted-foreground text-xs'>Saved</span>
			<Button variant='outline' size='sm' onClick={() => void close()}>
				Close project
			</Button>
		</header>
	)
}
