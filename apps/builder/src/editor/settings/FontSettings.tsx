import { useCallback, useEffect, useState } from 'react'
import type { FontChoice } from '@ui-system/core'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { FontImport } from '@/editor/fonts/FontImport'
import { useDocument } from '@/store/document'
import {
	sameChoice,
	setFont,
	weightsOf,
	type FontRole,
} from '@/store/fontActions'

const RUSSIAN = 'Съешь же ещё этих мягких французских булок'
const LATIN = 'The quick brown fox jumps over the lazy dog'

const ROLES: { role: FontRole; title: string; weight: number }[] = [
	{ role: 'heading', title: 'Headings', weight: 700 },
	{ role: 'body', title: 'Body text', weight: 400 },
]

const stack = (family: string) =>
	`"${family}", ui-sans-serif, system-ui, sans-serif`

function Sample({ family, weight }: { family: string | null; weight: number }) {
	return (
		<div
			className='bg-muted/40 rounded-lg border p-3 text-lg leading-snug'
			style={{
				fontFamily: family ? stack(family) : undefined,
				fontWeight: weight,
			}}
		>
			<p>{RUSSIAN}</p>
			<p>{LATIN}</p>
		</div>
	)
}

function RoleBlock({
	role,
	title,
	weight,
	library,
	onImported,
}: {
	role: FontRole
	title: string
	weight: number
	library: FontChoice[]
	onImported: () => void
}) {
	const current = useDocument((s) => s.doc?.site.fonts[role] ?? null)
	return (
		<section className='flex flex-col gap-3 rounded-lg border p-4'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<h3 className='text-sm font-medium'>{title}</h3>
					<p className='text-muted-foreground text-xs'>
						{current ? current.family : 'System font'}
						{current && ` (${weightsOf(current).join(', ')})`}
					</p>
				</div>
				<Button
					variant='outline'
					size='sm'
					disabled={!current}
					onClick={() => setFont(role, null)}
				>
					Use system font
				</Button>
			</div>
			<Sample family={current?.family ?? null} weight={weight} />
			{library.length > 0 && (
				<div className='flex flex-col gap-1.5'>
					<span className='text-muted-foreground text-xs'>
						Fonts in this project
					</span>
					<div className='flex flex-wrap gap-1.5'>
						{library.map((choice) => (
							<Button
								key={choice.family}
								size='sm'
								variant={
									sameChoice(choice, current) ||
									choice.family === current?.family
										? 'default'
										: 'outline'
								}
								style={{ fontFamily: stack(choice.family) }}
								onClick={() => setFont(role, choice)}
							>
								{choice.family}
							</Button>
						))}
					</div>
				</div>
			)}
			<FontImport
				onDone={(choice) => {
					setFont(role, choice)
					onImported()
				}}
			/>
		</section>
	)
}

// Heading and body fonts, imported from Google Fonts or from files on disk
export function FontSettings() {
	const [library, setLibrary] = useState<FontChoice[]>([])
	const [css, setCss] = useState('')
	const heading = useDocument((s) => s.doc?.site.fonts.heading)
	const body = useDocument((s) => s.doc?.site.fonts.body)

	const refresh = useCallback(() => {
		api.projectFonts()
			.then(setLibrary)
			.catch((error: Error) => console.error(error))
	}, [])
	useEffect(refresh, [refresh])

	// Samples need the @font-face rules of every font listed here
	useEffect(() => {
		const all = [...library, heading, body].filter((c): c is FontChoice =>
			Boolean(c)
		)
		let cancelled = false
		api.fontFaces(all)
			.then((res) => {
				if (!cancelled) setCss(res.css)
			})
			.catch((error: Error) => console.error(error))
		return () => {
			cancelled = true
		}
	}, [library, heading, body])

	return (
		<div className='flex flex-col gap-4 p-1'>
			<style>{css}</style>
			{ROLES.map((r) => (
				<RoleBlock
					key={r.role}
					{...r}
					library={library}
					onImported={refresh}
				/>
			))}
		</div>
	)
}
