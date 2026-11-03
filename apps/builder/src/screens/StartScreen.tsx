import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api, type Project, type RecentProject } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LangSwitch } from '@/components/LangSwitch'
import { useTranslation } from 'react-i18next'
import { currentLocale } from '@/i18n'
import { useProject } from '@/store/project'

export function StartScreen() {
	const { t } = useTranslation()
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
		if (!name.trim()) return void toast.error(t('start.enterName'))
		void run(() => api.create(path, name.trim(), currentLocale()))
	}

	return (
		<main className='mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-8 px-6 py-12'>
			<div className='flex items-start justify-between gap-4'>
				<h1 className='text-3xl font-semibold tracking-tight'>
					UI Builder
				</h1>
				<LangSwitch />
			</div>

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
					placeholder={t('start.folderPath')}
					aria-label={t('start.folderPath')}
				/>
				{creating && (
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t('start.siteName')}
						aria-label={t('start.siteName')}
						autoFocus
					/>
				)}
				<div className='flex gap-2'>
					<Button type='submit' disabled={busy || !path}>
						{t('start.open')}
					</Button>
					<Button
						type='button'
						variant='outline'
						disabled={busy || !path}
						onClick={create}
					>
						{t('start.create')}
					</Button>
				</div>
			</form>

			<section className='flex flex-col gap-2'>
				<h2 className='text-muted-foreground text-sm font-medium'>
					{t('start.recent')}
				</h2>
				{recent.length === 0 && (
					<p className='text-muted-foreground text-sm'>
						{t('start.nothing')}
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
