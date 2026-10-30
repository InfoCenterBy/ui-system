import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from 'cn'
import {
	addClass,
	parseClass,
	splitClasses,
	type ElementNode,
} from '@ui-system/core'
import { resolveVars } from '@ui-system/theme'
import { setClasses } from '@/store/actions'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ClassIndex } from '@ui-system/theme/classes'
import { useSiteThemeVars } from '@/editor/style/useSiteThemeVars'
import { suggest } from '@/editor/style/suggest'
import { useClassIndex } from '@/editor/style/useClassIndex'

// Variant prefix is shown dimmed in front of the utility
function ChipText({ raw }: { raw: string }) {
	const { variants, utility } = parseClass(raw)
	return (
		<>
			{variants.length > 0 && (
				<span className='text-muted-foreground'>
					{variants.join(':')}:
				</span>
			)}
			{utility}
		</>
	)
}

// Ends on Enter, Escape, blur (Tab) or a pointer-down outside, clicks inside move the caret
function ChipEditor({
	initial,
	onDone,
}: {
	initial: string
	onDone: (value: string | null) => void
}) {
	const [text, setText] = useState(initial)
	const ref = useRef<HTMLInputElement>(null)
	const done = useRef(false)
	const finish = (value: string | null) => {
		if (done.current) return
		done.current = true
		onDone(value)
	}
	useEffect(() => {
		const onDown = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node))
				finish(ref.current?.value ?? initial)
		}
		document.addEventListener('pointerdown', onDown, true)
		return () => document.removeEventListener('pointerdown', onDown, true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	return (
		<input
			ref={ref}
			autoFocus
			aria-label='Edit class'
			value={text}
			size={Math.max(6, text.length + 1)}
			className='bg-background border-ring h-6 min-w-0 rounded-md border px-1.5 font-mono text-xs outline-none'
			// The field below must not take focus from the editor
			onClick={(e) => e.stopPropagation()}
			onChange={(e) => setText(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === 'Enter') finish(text)
				if (e.key === 'Escape') finish(null)
			}}
			// Tab and other focus loss commit, finish ignores repeats
			onBlur={(e) => finish(e.currentTarget.value)}
		/>
	)
}

// CSS of a class, computed only while the tooltip is open
function ChipCss({ raw, index }: { raw: string; index: ClassIndex | null }) {
	const css = index?.cssOf(raw)
	return (
		<pre className='max-h-48 overflow-auto font-mono text-[10px] leading-4 whitespace-pre-wrap'>
			{css ?? 'No CSS for this class'}
		</pre>
	)
}

export function ClassField({ node }: { node: ElementNode }) {
	const state = useClassIndex()
	const themeVars = useSiteThemeVars()
	const inputRef = useRef<HTMLInputElement>(null)
	const [typed, setTyped] = useState('')
	const [focused, setFocused] = useState(false)
	const [active, setActive] = useState(-1)
	const [hovered, setHovered] = useState<number | null>(null)
	const [editing, setEditing] = useState<number | null>(null)
	const tokens = splitClasses(node.classes)
	const index = state.status === 'ready' ? state.index : null

	const suggestions = useMemo(
		() => (index && focused ? suggest(typed, index) : []),
		[index, focused, typed]
	)
	const preview = suggestions[hovered ?? active]
	const previewCss = preview && index ? index.cssOf(preview.name) : null

	const commit = (list: string[]) => setClasses(node.id, list.join(' '))

	const add = (raw: string) => {
		const clean = raw.trim().replace(/,$/, '')
		// A lone variant like "md:" is not a class yet
		if (clean && !clean.endsWith(':'))
			setClasses(node.id, addClass(node.classes, clean))
		setTyped('')
		setActive(-1)
	}

	const pick = (value: string) => {
		// A variant stays in the field so the class can follow
		if (value.endsWith(':')) {
			setTyped(value)
			setActive(-1)
			inputRef.current?.focus()
		} else add(value)
	}

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			if (suggestions.length === 0) return
			e.preventDefault()
			const step = e.key === 'ArrowDown' ? 1 : -1
			setActive(
				(a) => (a + step + suggestions.length) % suggestions.length
			)
		} else if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault()
			const chosen = active >= 0 ? suggestions[active] : null
			if (chosen) pick(chosen.value)
			else add(typed)
		} else if (e.key === 'Backspace' && typed === '' && tokens.length) {
			commit(tokens.slice(0, -1))
		} else if (e.key === 'Escape') {
			setTyped('')
			setActive(-1)
		}
	}

	const finishEdit = (at: number, value: string | null) => {
		setEditing(null)
		if (value === null) return
		const next = splitClasses(value)
		commit([...tokens.slice(0, at), ...next, ...tokens.slice(at + 1)])
	}

	const swatch = (name: string, kind: string) => {
		if (!index || kind === 'variant') return null
		const color = index.colorOf(name)
		return color ? resolveVars(color, themeVars) : null
	}

	return (
		<div className='flex flex-col gap-1.5 text-sm'>
			<span className='text-muted-foreground text-xs'>Classes</span>
			<div
				className={cn(
					'border-input bg-background relative flex min-h-8 flex-wrap items-center gap-1 rounded-lg border p-1',
					focused && 'border-ring ring-ring/50 ring-3'
				)}
				onClick={() => inputRef.current?.focus()}
			>
				{tokens.map((raw, i) =>
					editing === i ? (
						<ChipEditor
							key={`${raw}:${i}`}
							initial={raw}
							onDone={(value) => finishEdit(i, value)}
						/>
					) : (
						<Tooltip key={`${raw}:${i}`} delayDuration={500}>
							<TooltipTrigger asChild>
								<span
									className='bg-muted flex min-h-6 items-center gap-0.5 rounded-md py-0.5 pr-0.5 pl-1.5 font-mono text-xs break-all'
									onDoubleClick={() => setEditing(i)}
								>
									<span>
										<ChipText raw={raw} />
									</span>
									<button
										type='button'
										aria-label={`Remove ${raw}`}
										className='text-muted-foreground hover:text-foreground flex size-4 items-center justify-center rounded'
										onClick={(e) => {
											e.stopPropagation()
											commit(
												tokens.filter(
													(_, at) => at !== i
												)
											)
										}}
									>
										<XIcon className='size-3' />
									</button>
								</span>
							</TooltipTrigger>
							<TooltipContent className='block max-w-sm'>
								<ChipCss raw={raw} index={index} />
							</TooltipContent>
						</Tooltip>
					)
				)}
				<input
					ref={inputRef}
					aria-label='Add class'
					value={typed}
					placeholder={tokens.length ? '' : 'Add a class'}
					autoComplete='off'
					spellCheck={false}
					className='placeholder:text-muted-foreground h-6 min-w-16 flex-1 bg-transparent px-1 font-mono text-xs outline-none'
					onChange={(e) => {
						setTyped(e.target.value.replace(/[\s,]+$/, ''))
						setActive(-1)
					}}
					onKeyDown={onKeyDown}
					onFocus={() => setFocused(true)}
					onBlur={() => {
						setFocused(false)
						setHovered(null)
						if (typed.trim()) add(typed)
					}}
				/>
			</div>
			{suggestions.length > 0 && (
				<div className='border-border bg-popover relative rounded-lg border shadow-sm'>
					<ul
						role='listbox'
						className='max-h-56 overflow-y-auto p-1'
						onMouseLeave={() => setHovered(null)}
					>
						{suggestions.map((s, i) => {
							const color = swatch(s.name, s.kind)
							return (
								<li
									key={s.value}
									role='option'
									aria-selected={i === active}
									className={cn(
										'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 font-mono text-xs',
										(hovered ?? active) === i && 'bg-accent'
									)}
									// Keeps the field focused while clicking
									onMouseDown={(e) => e.preventDefault()}
									onMouseEnter={() => setHovered(i)}
									onClick={() => pick(s.value)}
								>
									<span
										className='border-border size-3 shrink-0 rounded-sm border'
										style={{
											background: color ?? 'transparent',
											visibility: color
												? 'visible'
												: 'hidden',
										}}
									/>
									<span className='min-w-0 flex-1 truncate'>
										{s.name}
									</span>
									{s.kind !== 'utility' && (
										<span className='text-muted-foreground font-sans text-[10px]'>
											{s.kind === 'component'
												? 'daisyUI'
												: 'variant'}
										</span>
									)}
								</li>
							)
						})}
					</ul>
					{previewCss && (
						<pre className='border-border text-muted-foreground max-h-32 overflow-auto border-t p-2 font-mono text-[10px] leading-4 whitespace-pre-wrap'>
							{previewCss}
						</pre>
					)}
				</div>
			)}
			{state.status === 'loading' && focused && (
				<p className='text-muted-foreground text-xs'>
					Loading suggestions...
				</p>
			)}
			{state.status === 'error' && (
				<p className='text-muted-foreground text-xs'>
					Suggestions are not available
				</p>
			)}
		</div>
	)
}
