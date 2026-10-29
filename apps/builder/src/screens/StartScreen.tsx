import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api, type Project, type RecentProject } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProject } from '@/store/project'

export function StartScreen() {
	const openProject = useProject((s) => s.openProject)
	const [folder, setFolder] = useState('')
	const [recent, setRecent] = useState<RecentProject[]>([])
	const [creating, setCreating] = useState(false)
	const [name, setName] = useState('')
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		api.recent()
			.then(setRecent)
			.catch((e: Error) => toast.error(e.message))
	}, [])

	async function run(action: () => Promise<Project>) {
		setBusy(true)
		try {
			openProject(await action())
		} catch (e) {
			toast.error((e as Error).message)
		} finally {
			setBusy(false)
		}
	}

	const path = folder.trim()

	function create() {
		if (!creating) return setCreating(true)
		if (!name.trim()) return void toast.error('Enter a site name')
		void run(() => api.create(path, name.trim()))
	}

	return (
		<main className='mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-8 px-6 py-12'>
			<h1 className='text-3xl font-semibold tracking-tight'>
				UI Builder
			</h1>

			<form
				className='flex flex-col gap-3'
				onSubmit={(e) => {
					e.preventDefault()
					if (path) void run(() => api.open(path))
				}}
			>
				<Input
					value={folder}
					onChange={(e) => setFolder(e.target.value)}
					placeholder='Project folder path'
					aria-label='Project folder path'
				/>
				{creating && (
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Site name'
						aria-label='Site name'
						autoFocus
					/>
				)}
				<div className='flex gap-2'>
					<Button type='submit' disabled={busy || !path}>
						Open
					</Button>
					<Button
						type='button'
						variant='outline'
						disabled={busy || !path}
						onClick={create}
					>
						Create
					</Button>
				</div>
			</form>

			<section className='flex flex-col gap-2'>
				<h2 className='text-muted-foreground text-sm font-medium'>
					Recent projects
				</h2>
				{recent.length === 0 && (
					<p className='text-muted-foreground text-sm'>
						Nothing yet.
					</p>
				)}
				<ul className='flex flex-col'>
					{recent.map((r) => (
						<li key={r.path}>
							<button
								type='button'
								disabled={busy}
								onClick={() => void run(() => api.open(r.path))}
								className='hover:bg-muted w-full rounded-md px-3 py-2 text-left'
							>
								<div className='text-sm font-medium'>
									{r.name}
								</div>
								<div className='text-muted-foreground truncate text-xs'>
									{r.path}
								</div>
							</button>
						</li>
					))}
				</ul>
			</section>
		</main>
	)
}
