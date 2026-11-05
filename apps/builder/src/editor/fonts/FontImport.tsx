import { useEffect, useState } from 'react'
import { LoaderIcon } from 'lucide-react'
import type { FontChoice } from '@ui-system/core'
import { api, type GoogleFontSuggestion } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { t } from '@/i18n'

const ALL_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

function toggle(list: number[], weight: number) {
	return list.includes(weight)
		? list.filter((w) => w !== weight)
		: [...list, weight].sort((a, b) => a - b)
}

// Runs an async import and keeps the busy flag and error text for the form
function useJob(onDone: (choice: FontChoice) => void) {
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const run = async (job: () => Promise<FontChoice>) => {
		setBusy(true)
		setError(null)
		try {
			onDone(await job())
		} catch (e) {
			setError(e instanceof Error ? e.message : t('fonts.importFailed'))
		} finally {
			setBusy(false)
		}
	}
	return { busy, error, run }
}

function GoogleImport({ onDone }: { onDone: (c: FontChoice) => void }) {
	const [query, setQuery] = useState('')
	const [suggestions, setSuggestions] = useState<
		GoogleFontSuggestion[] | null
	>(null)
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(0)
	const [weights, setWeights] = useState([400, 700])
	const [italic, setItalic] = useState(false)
	const { busy, error, run } = useJob(onDone)

	useEffect(() => {
		if (!open) return
		let cancelled = false
		// An empty query lists the first families, so there is something to browse
		const timer = setTimeout(() => {
			api.searchGoogleFonts(query)
				.then((list) => {
					if (cancelled) return
					setSuggestions(list)
					setActive(0)
				})
				.catch(() => !cancelled && setSuggestions([]))
		}, 200)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [query, open])

	const known = suggestions?.find(
		(s) => s.family.toLowerCase() === query.trim().toLowerCase()
	)
	const choices = known?.weights.length ? known.weights : ALL_WEIGHTS
	const shown = open ? (suggestions ?? []) : []
	const noMatches =
		open && suggestions?.length === 0 && query.trim().length > 0

	const pick = (s: GoogleFontSuggestion) => {
		setQuery(s.family)
		setWeights((w) => {
			const kept = w.filter((x) => s.weights.includes(x))
			return kept.length ? kept : s.weights.slice(0, 1)
		})
		setOpen(false)
	}

	return (
		<div className='flex flex-col gap-3'>
			<div>
				<Field label={t('fonts.family')}>
					<Input
						value={query}
						placeholder={t('fonts.searchPlaceholder')}
						onChange={(e) => {
							setQuery(e.target.value)
							setOpen(true)
						}}
						onFocus={() => setOpen(true)}
						onBlur={() => setTimeout(() => setOpen(false), 150)}
						onKeyDown={(e) => {
							if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
								e.preventDefault()
								setOpen(true)
								const step = e.key === 'ArrowDown' ? 1 : -1
								setActive((i) =>
									Math.max(
										0,
										Math.min(shown.length - 1, i + step)
									)
								)
							} else if (e.key === 'Enter' && shown[active]) {
								e.preventDefault()
								pick(shown[active])
							}
						}}
					/>
				</Field>
				{noMatches && (
					<p className='text-muted-foreground mt-1 text-xs'>
						{t('fonts.noMatches')}
					</p>
				)}
				{shown.length > 0 && (
					<ul className='bg-popover mt-1 max-h-48 w-full overflow-auto rounded-lg border p-1'>
						{shown.map((s, i) => (
							<li key={s.family}>
								<button
									type='button'
									className={`hover:bg-muted flex w-full justify-between rounded px-2 py-1 text-left text-sm ${i === active ? 'bg-muted' : ''}`}
									onMouseDown={(e) => {
										e.preventDefault()
										pick(s)
									}}
								>
									<span>{s.family}</span>
									<span className='text-muted-foreground text-xs'>
										{s.category}
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
			<div className='flex flex-wrap items-center gap-3 text-sm'>
				{choices.map((w) => (
					<label key={w} className='flex items-center gap-1'>
						<input
							type='checkbox'
							checked={weights.includes(w)}
							onChange={() =>
								setWeights((list) => toggle(list, w))
							}
						/>
						{w}
					</label>
				))}
				<label className='ml-2 flex items-center gap-1'>
					<input
						type='checkbox'
						role='switch'
						checked={italic}
						onChange={(e) => setItalic(e.target.checked)}
					/>
					{t('fonts.italic')}
				</label>
			</div>
			<div className='flex items-center gap-3'>
				<Button
					size='sm'
					disabled={busy || !query.trim() || weights.length === 0}
					onClick={() =>
						run(() =>
							api.importGoogleFont({
								family: query.trim(),
								weights,
								italic,
							})
						)
					}
				>
					{busy && <LoaderIcon className='animate-spin' />}
					{busy ? t('fonts.importing') : t('fonts.import')}
				</Button>
				{error && <p className='text-destructive text-xs'>{error}</p>}
			</div>
		</div>
	)
}

function LocalImport({ onDone }: { onDone: (c: FontChoice) => void }) {
	const [family, setFamily] = useState('')
	const [weight, setWeight] = useState(400)
	const [style, setStyle] = useState<'normal' | 'italic'>('normal')
	const [files, setFiles] = useState<File[]>([])
	const { busy, error, run } = useJob(onDone)

	return (
		<div className='flex flex-col gap-3'>
			<div className='grid grid-cols-3 gap-3'>
				<Field label={t('fonts.familyName')}>
					<Input
						value={family}
						onChange={(e) => setFamily(e.target.value)}
					/>
				</Field>
				<Field label={t('fonts.weight')}>
					<NativeSelect
						value={weight}
						onChange={(e) => setWeight(Number(e.target.value))}
					>
						{ALL_WEIGHTS.map((w) => (
							<option key={w} value={w}>
								{w}
							</option>
						))}
					</NativeSelect>
				</Field>
				<Field label={t('fonts.style')}>
					<NativeSelect
						value={style}
						onChange={(e) =>
							setStyle(
								e.target.value === 'italic'
									? 'italic'
									: 'normal'
							)
						}
					>
						<option value='normal'>{t('fonts.normal')}</option>
						<option value='italic'>{t('fonts.italic')}</option>
					</NativeSelect>
				</Field>
			</div>
			<Input
				type='file'
				multiple
				accept='.woff2,.woff,.ttf,.otf'
				onChange={(e) => setFiles([...(e.target.files ?? [])])}
			/>
			<div className='flex items-center gap-3'>
				<Button
					size='sm'
					disabled={busy || !family.trim() || files.length === 0}
					onClick={() =>
						run(() =>
							api.uploadFontFiles({
								family: family.trim(),
								weight,
								style,
								files,
							})
						)
					}
				>
					{busy && <LoaderIcon className='animate-spin' />}
					{busy ? t('fonts.uploading') : t('fonts.upload')}
				</Button>
				{error && <p className='text-destructive text-xs'>{error}</p>}
			</div>
		</div>
	)
}

// Adds a family to the project from Google Fonts or from files on disk
export function FontImport({ onDone }: { onDone: (c: FontChoice) => void }) {
	const [mode, setMode] = useState<'google' | 'local'>('google')
	return (
		<div className='flex flex-col gap-3 border-t pt-3'>
			<div className='flex gap-1.5'>
				<Button
					size='sm'
					variant={mode === 'google' ? 'secondary' : 'ghost'}
					onClick={() => setMode('google')}
				>
					{t('fonts.google')}
				</Button>
				<Button
					size='sm'
					variant={mode === 'local' ? 'secondary' : 'ghost'}
					onClick={() => setMode('local')}
				>
					{t('fonts.upload')}
				</Button>
			</div>
			{mode === 'google' ? (
				<GoogleImport onDone={onDone} />
			) : (
				<LocalImport onDone={onDone} />
			)}
		</div>
	)
}
