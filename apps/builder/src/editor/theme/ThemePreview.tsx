import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { SiteTheme } from '@/store/themeActions'

const COLORS = [
	'primary',
	'secondary',
	'accent',
	'neutral',
	'info',
	'success',
	'warning',
	'error',
]

const buttons = COLORS.map((c) => `<button class="btn btn-${c}">${c}</button>`)

const BODY = `
<div class="flex flex-col gap-3 p-4 bg-base-100 text-base-content">
	<div class="flex flex-wrap gap-2">${buttons.join('')}</div>
	<div class="flex flex-wrap gap-4">
		<div class="card bg-base-200 w-60 shadow-sm"><div class="card-body">
			<h2 class="card-title">Card title</h2><p>Some card text on base-200.</p>
			<div class="card-actions justify-end"><button class="btn btn-primary btn-sm">Action</button></div>
		</div></div>
		<div class="flex flex-col gap-2 grow">
			<input class="input w-full" placeholder="Input" />
			<div class="flex gap-2"><span class="badge badge-primary">Badge</span><span class="badge badge-outline">Outline</span></div>
			<div role="alert" class="alert alert-info"><span>An info alert</span></div>
		</div>
	</div>
</div>`

const CLASSES = [
	...new Set(
		[...BODY.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/))
	),
].filter(Boolean)

// Real daisyUI markup, styled by CSS built for exactly these classes
export function ThemePreview({ theme }: { theme: SiteTheme }) {
	const [doc, setDoc] = useState('')
	const key = JSON.stringify(theme)
	useEffect(() => {
		let cancelled = false
		const timer = setTimeout(() => {
			api.css(CLASSES, JSON.parse(key))
				.then(({ css }) => {
					if (!cancelled) setDoc(`<style>${css}</style>${BODY}`)
				})
				.catch((error: Error) => console.error(error))
		}, 150)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [key])
	return (
		<iframe
			title='Theme preview'
			srcDoc={doc}
			className='border-border h-72 w-full rounded-md border'
		/>
	)
}
