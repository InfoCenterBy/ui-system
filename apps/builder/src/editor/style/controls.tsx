import { useId, useState, type ReactNode } from 'react'
import { RotateCcwIcon } from 'lucide-react'
import { cn } from 'cn'
import {
	BREAKPOINTS,
	getUtility,
	resolveUtility,
	setUtility,
	type Breakpoint,
	type UtilityGroup,
} from '@ui-system/core'
import { setClasses } from '@/store/actions'
import { useDocument } from '@/store/document'
import {
	COLOR_TOKENS,
	OPACITY_STEPS,
	colorUtility,
	isColorToken,
	joinPrefix,
	parseColorUtility,
	parseValueInput,
	stripPrefix,
} from '@/editor/style/values'

export interface StyleContext {
	id: string
	classes: string
	bp: Breakpoint
}

const labelOfBreakpoint = (bp: Breakpoint) =>
	BREAKPOINTS.find((b) => b.prefix === bp)?.label ?? bp

export interface RowState {
	// Utility in effect at the active breakpoint, set there or inherited
	value: string | null
	inherited: boolean
	set: (utility: string | null) => void
}

// One utility group at the active breakpoint with its label, source hint and reset
export function StyleRow({
	ctx,
	group,
	label,
	stacked = false,
	children,
}: {
	ctx: StyleContext
	group: UtilityGroup
	label: string
	// Control below the label instead of beside it
	stacked?: boolean
	children: (state: RowState) => ReactNode
}) {
	const own = getUtility(ctx.classes, group, ctx.bp)
	const resolved = resolveUtility(ctx.classes, group, ctx.bp)
	const inherited = own === null && resolved !== null
	const set = (utility: string | null) =>
		setClasses(ctx.id, setUtility(ctx.classes, group, ctx.bp, utility))
	return (
		<div
			className={cn(
				'grid items-center gap-x-2 gap-y-1',
				stacked
					? 'grid-cols-[1fr_1.25rem]'
					: 'grid-cols-[4.25rem_1fr_1.25rem]'
			)}
		>
			<div className='flex min-w-0 flex-col leading-tight'>
				<span className='text-muted-foreground truncate text-xs'>
					{label}
				</span>
				{inherited && resolved && (
					<span className='text-muted-foreground/70 truncate text-[10px]'>
						from {labelOfBreakpoint(resolved.from)}
					</span>
				)}
			</div>
			{!stacked && (
				<div className='min-w-0'>
					{children({
						value: resolved?.utility ?? null,
						inherited,
						set,
					})}
				</div>
			)}
			<button
				type='button'
				aria-label={`Reset ${label}`}
				title={`Reset at ${labelOfBreakpoint(ctx.bp)}`}
				className={cn(
					'text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded',
					stacked ? 'col-start-2 row-start-1' : 'col-start-3',
					own === null && 'invisible'
				)}
				onClick={() => set(null)}
			>
				<RotateCcwIcon className='size-3' />
			</button>
			{stacked && (
				<div className='col-span-2 min-w-0'>
					{children({
						value: resolved?.utility ?? null,
						inherited,
						set,
					})}
				</div>
			)}
		</div>
	)
}

export interface Choice {
	value: string
	label: ReactNode
	title?: string
}

// Buttons for a few utilities that exclude each other
export function Segmented({
	state,
	options,
}: {
	state: RowState
	options: Choice[]
}) {
	return (
		<div className='border-input flex overflow-hidden rounded-lg border'>
			{options.map((option) => {
				const selected = state.value === option.value
				return (
					<button
						key={option.value}
						type='button'
						title={option.title}
						aria-pressed={selected}
						className={cn(
							'flex h-7 min-w-0 flex-1 items-center justify-center px-1 text-xs',
							'not-first:border-input not-first:border-l',
							selected
								? state.inherited
									? 'bg-muted text-muted-foreground italic'
									: 'text-primary-foreground bg-primary'
								: 'hover:bg-muted'
						)}
						onClick={() =>
							state.set(
								selected && !state.inherited
									? null
									: option.value
							)
						}
					>
						{option.label}
					</button>
				)
			})}
		</div>
	)
}

// Native select over utilities, values outside the list are kept as extra options
export function Choose({
	state,
	options,
}: {
	state: RowState
	options: Choice[]
}) {
	const known = options.some((o) => o.value === state.value)
	return (
		<select
			value={state.value ?? ''}
			className={cn(
				'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-7 w-full rounded-lg border px-1.5 text-xs outline-none focus-visible:ring-3',
				state.inherited && 'text-muted-foreground italic'
			)}
			onChange={(e) => state.set(e.target.value || null)}
		>
			<option value=''>-</option>
			{state.value && !known && (
				<option value={state.value}>{state.value}</option>
			)}
			{options.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	)
}

// Text field with suggested steps, any other length becomes an arbitrary value
export function ValueInput({
	state,
	prefix,
	options,
	negative = false,
}: {
	state: RowState
	prefix: string
	options: readonly string[]
	negative?: boolean
}) {
	const listId = useId()
	const raw = state.value ? stripPrefix(state.value, prefix) : null
	// Arbitrary values read as typed, 18px instead of [18px]
	const current = raw?.replace(/^(-?)\[(.*)\]$/, '$1$2') ?? null
	// Edits are kept per value so a reset or a new selection shows the stored one
	const [draft, setDraft] = useState<{ from: string; text: string } | null>(
		null
	)
	const shown =
		draft && draft.from === (current ?? '') ? draft.text : (current ?? '')

	const commit = (typed: string) => {
		setDraft(null)
		const text = typed.trim()
		if (text === (current ?? '')) return
		if (text === '') return state.set(null)
		const value = parseValueInput(text, options, negative)
		if (value !== null) state.set(joinPrefix(prefix, value))
	}

	return (
		<>
			<input
				value={shown}
				list={listId}
				placeholder='-'
				autoComplete='off'
				spellCheck={false}
				aria-label={prefix}
				className={cn(
					'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-7 w-full min-w-0 rounded-lg border px-1.5 text-xs outline-none focus-visible:ring-3',
					state.inherited && 'text-muted-foreground italic'
				)}
				onChange={(e) =>
					setDraft({ from: current ?? '', text: e.target.value })
				}
				onBlur={(e) => commit(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur()
					if (e.key === 'Escape') {
						setDraft(null)
						e.currentTarget.blur()
					}
				}}
			/>
			<datalist id={listId}>
				{options.map((o) => (
					<option key={o} value={o} />
				))}
			</datalist>
		</>
	)
}

// Theme color for a token, the canvas shows the same one
function useTokenColor(token: string) {
	const vars = useDocument((s) => s.doc?.site.theme.vars)
	return vars?.[`--color-${token}`] ?? `var(--color-${token})`
}

function Swatch({
	token,
	selected,
	dim,
	onClick,
}: {
	token: string
	selected: boolean
	dim: boolean
	onClick: () => void
}) {
	const color = useTokenColor(token)
	return (
		<button
			type='button'
			title={token}
			aria-label={token}
			aria-pressed={selected}
			className={cn(
				'border-border size-5 rounded-md border',
				selected && 'ring-ring ring-2 ring-offset-1',
				selected && dim && 'opacity-60'
			)}
			style={{ background: color }}
			onClick={onClick}
		/>
	)
}

// Daisy color tokens as swatches with an optional opacity like /70
export function ColorSwatches({
	state,
	prefix,
}: {
	state: RowState
	prefix: string
}) {
	const current = state.value ? parseColorUtility(state.value, prefix) : null
	const custom = current && !isColorToken(current.token)
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex flex-wrap gap-1.5'>
				{COLOR_TOKENS.map((token) => (
					<Swatch
						key={token}
						token={token}
						selected={current?.token === token}
						dim={state.inherited}
						onClick={() =>
							state.set(
								current?.token === token && !state.inherited
									? null
									: colorUtility(
											prefix,
											token,
											current?.opacity ?? null
										)
							)
						}
					/>
				))}
			</div>
			<div className='flex items-center gap-2'>
				<select
					aria-label={`${prefix} opacity`}
					disabled={!current || custom === true}
					value={current?.opacity ?? ''}
					className='border-input bg-background h-6 rounded-md border px-1 text-xs disabled:opacity-50'
					onChange={(e) =>
						current &&
						state.set(
							colorUtility(
								prefix,
								current.token,
								e.target.value ? Number(e.target.value) : null
							)
						)
					}
				>
					<option value=''>Opacity 100</option>
					{OPACITY_STEPS.slice(1).map((o) => (
						<option key={o} value={o}>
							Opacity {o}
						</option>
					))}
				</select>
				{custom && (
					<span className='text-muted-foreground truncate font-mono text-[10px]'>
						{state.value}
					</span>
				)}
			</div>
		</div>
	)
}
