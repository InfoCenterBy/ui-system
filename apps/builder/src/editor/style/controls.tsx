import {
	Fragment,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import { PipetteIcon, RotateCcwIcon } from 'lucide-react'
import { cn } from 'cn'
import {
	BREAKPOINTS,
	getUtility,
	resolveUtility,
	setUtility,
	tokenNamesFor,
	type Breakpoint,
	type State,
	type UtilityGroup,
} from '@ui-system/core'
import { t } from '@/i18n'
import { setClasses } from '@/store/actions'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { resolveVars } from '@ui-system/theme'
import type { ClassIndex } from '@ui-system/theme/classes'
import { overriddenAt } from '@/editor/style/target'
import { useSiteThemeVars } from '@/editor/style/useSiteThemeVars'
import { useClassIndex } from '@/editor/style/useClassIndex'
import { useSiteTokens, useTokenColors } from '@/editor/style/useSiteTokens'
import {
	COLOR_TOKENS,
	OPACITY_STEPS,
	colorUtility,
	customColorUtility,
	colorForPicker,
	customColorCss,
	normalizeColor,
	paletteUtility,
	parsePaletteColor,
	isColorToken,
	normalizeHex,
	parseCustomColor,
	joinPrefix,
	parseColorUtility,
	parseValueInput,
	pxHint,
	stripPrefix,
} from '@/editor/style/values'

export interface StyleContext {
	id: string
	classes: string
	// Breakpoint written to, chosen in the panel header
	bp: Breakpoint
	// Breakpoint of the canvas width, only used to spot overrides
	canvasBp: Breakpoint
	// Pseudo-class written to, '' is none
	state: State
}

const labelOfBreakpoint = (bp: Breakpoint) =>
	bp === ''
		? t('style.allScreens')
		: (BREAKPOINTS.find((b) => b.prefix === bp)?.label ?? bp)

export interface RowState {
	// Utility in effect at the active breakpoint, set there or inherited
	value: string | null
	inherited: boolean
	set: (utility: string | null) => void
}

type Source = 'set' | 'inherited' | 'overridden' | 'none'

// Small dot: where the shown value comes from
function SourceDot({ source }: { source: Source }) {
	if (source === 'none') return <span className='size-1.5 shrink-0' />
	const text = {
		set: t('style.sourceSet'),
		inherited: t('style.sourceInherited'),
		overridden: t('style.sourceOverridden'),
	}[source]
	return (
		<span
			role='img'
			aria-label={text}
			title={text}
			className={cn(
				'size-1.5 shrink-0 rounded-full border',
				source === 'set' && 'border-primary bg-primary',
				source === 'inherited' &&
					'border-muted-foreground/60 bg-transparent',
				source === 'overridden' && 'border-amber-500 bg-amber-500'
			)}
		/>
	)
}

// One utility group at the active breakpoint with its label, source hint and reset
export function StyleRow({
	ctx,
	group,
	label,
	stacked = false,
	apply,
	note,
	children,
}: {
	ctx: StyleContext
	group: UtilityGroup
	label: string
	// Control below the label instead of beside it
	stacked?: boolean
	// Replaces the plain class write, e.g. to add a companion utility; at is the breakpoint
	apply?: (utility: string | null, at: Breakpoint) => string
	// Muted line under the row
	note?: ReactNode
	children: (state: RowState) => ReactNode
}) {
	const own = getUtility(ctx.classes, group, ctx.bp, ctx.state)
	const resolved = resolveUtility(ctx.classes, group, ctx.bp, ctx.state)
	const inherited = own === null && resolved !== null
	const overrideFrom = overriddenAt(
		ctx.classes,
		group,
		ctx.bp,
		ctx.canvasBp,
		ctx.state
	)
	// Companion writes only know plain classes, a state uses the plain write
	const write = (utility: string | null, at: Breakpoint) =>
		apply && !ctx.state
			? apply(utility, at)
			: setUtility(ctx.classes, group, at, utility, ctx.state)
	const set = (utility: string | null) =>
		setClasses(ctx.id, write(utility, ctx.bp))
	const source =
		overrideFrom !== null
			? 'overridden'
			: own !== null
				? 'set'
				: inherited
					? 'inherited'
					: 'none'
	return (
		<div
			className={cn(
				'grid items-center gap-x-2 gap-y-1',
				stacked
					? 'grid-cols-[1fr_1.25rem]'
					: 'grid-cols-[6.25rem_1fr_1.25rem]'
			)}
		>
			<div className='flex min-w-0 flex-col leading-tight'>
				<span className='text-muted-foreground flex items-center gap-1 text-xs'>
					<SourceDot source={source} />
					<span className='truncate'>{label}</span>
				</span>
				{inherited && resolved && (
					<span className='text-muted-foreground/70 truncate pl-2.5 text-[10px]'>
						{ctx.state && resolved.state === ''
							? t('style.inheritedBase')
							: t('style.inheritedFrom', {
									bp: labelOfBreakpoint(resolved.from),
								})}
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
				aria-label={t('style.reset', { label })}
				title={t('style.resetAt', { bp: labelOfBreakpoint(ctx.bp) })}
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
			{overrideFrom !== null && (
				<p className='text-muted-foreground/80 col-span-full flex items-center gap-1 text-[10px] leading-tight'>
					<span>
						{t('style.overriddenAt', {
							bp: labelOfBreakpoint(overrideFrom),
						})}
					</span>
					<button
						type='button'
						className='text-primary underline'
						onClick={() =>
							setClasses(ctx.id, write(null, overrideFrom))
						}
					>
						{t('style.resetOverride')}
					</button>
				</p>
			)}
			{note && (
				<p className='text-muted-foreground/80 col-span-full text-[10px] leading-tight'>
					{note}
				</p>
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

// Text field with a dropdown of steps, any other length becomes an arbitrary value
export function ValueInput({
	state,
	prefix,
	options: baseOptions,
	negative = false,
}: {
	state: RowState
	prefix: string
	options: readonly string[]
	negative?: boolean
}) {
	const tokens = useSiteTokens()
	// Site tokens that fit the utility join the list
	const options = useMemo(
		() => [...baseOptions, ...tokenNamesFor(tokens, prefix)],
		[baseOptions, tokens, prefix]
	)
	const raw = state.value ? stripPrefix(state.value, prefix) : null
	// Arbitrary values read as typed, 18px instead of [18px]
	const current = raw?.replace(/^(-?)\[(.*)\]$/, '$1$2') ?? null
	// Edits are kept per value so a reset or a new selection shows the stored one
	const [draft, setDraft] = useState<{ from: string; text: string } | null>(
		null
	)
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(-1)
	const anchorRef = useRef<HTMLDivElement>(null)
	const listRef = useRef<HTMLUListElement>(null)
	// Open state when the mouse went down, so a click toggles the list
	const pressRef = useRef<boolean | null>(null)
	const shown =
		draft && draft.from === (current ?? '') ? draft.text : (current ?? '')

	// Filters only while new text is typed, the current value shows everything
	const typing = shown !== '' && shown !== (current ?? '')
	const visible = typing
		? options.filter((o) => o.toLowerCase().includes(shown.toLowerCase()))
		: options
	const typed = shown ? parseValueInput(shown, options, negative) : null
	const hint = typed === null ? null : pxHint(prefix, typed)

	useEffect(() => {
		if (!open || active < 0) return
		listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
	}, [open, active])

	const commit = (typed: string) => {
		setDraft(null)
		const text = typed.trim()
		if (text === (current ?? '')) return
		if (text === '') return state.set(null)
		const value = parseValueInput(text, options, negative)
		if (value !== null) state.set(joinPrefix(prefix, value))
	}

	const choose = (option: string) => {
		setDraft(null)
		setOpen(false)
		setActive(-1)
		if (option !== current) state.set(joinPrefix(prefix, option))
	}

	return (
		<Popover open={open && visible.length > 0} onOpenChange={setOpen}>
			<PopoverAnchor asChild>
				<div ref={anchorRef} className='relative'>
					{hint && (
						<span className='text-muted-foreground/70 pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[10px]'>
							{hint}
						</span>
					)}
					<input
						value={shown}
						role='combobox'
						aria-expanded={open}
						aria-label={prefix}
						placeholder='-'
						autoComplete='off'
						spellCheck={false}
						className={cn(
							'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-7 w-full min-w-0 rounded-lg border px-1.5 text-xs outline-none focus-visible:ring-3',
							hint && 'pr-12',
							state.inherited && 'text-muted-foreground italic'
						)}
						onMouseDown={() => {
							pressRef.current = open
						}}
						// Keyboard focus opens the list, a mouse click toggles it
						onFocus={() => {
							if (pressRef.current === null) setOpen(true)
						}}
						onClick={() => {
							const wasOpen = pressRef.current
							pressRef.current = null
							setActive(-1)
							setOpen(!wasOpen)
						}}
						onChange={(e) => {
							setDraft({
								from: current ?? '',
								text: e.target.value,
							})
							setActive(-1)
							setOpen(true)
						}}
						onBlur={(e) => {
							pressRef.current = null
							setOpen(false)
							setActive(-1)
							commit(e.currentTarget.value)
						}}
						onKeyDown={(e) => {
							if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
								e.preventDefault()
								if (!open) return setOpen(true)
								const step = e.key === 'ArrowDown' ? 1 : -1
								const n = visible.length
								setActive((a) =>
									a < 0
										? step > 0
											? 0
											: n - 1
										: (a + step + n) % n
								)
							} else if (e.key === 'Enter') {
								const chosen = open
									? visible[active]
									: undefined
								if (chosen !== undefined) choose(chosen)
								else e.currentTarget.blur()
							} else if (e.key === 'Escape') {
								if (open) {
									e.stopPropagation()
									setOpen(false)
								} else {
									setDraft(null)
									e.currentTarget.blur()
								}
							}
						}}
					/>
				</div>
			</PopoverAnchor>
			<PopoverContent
				className='w-(--radix-popover-trigger-width) min-w-20 p-1'
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={(e) => {
					if (anchorRef.current?.contains(e.target as Node))
						e.preventDefault()
				}}
			>
				<ul
					ref={listRef}
					role='listbox'
					className='max-h-52 overflow-y-auto'
				>
					{visible.map((o, i) => (
						<li
							key={o}
							role='option'
							aria-selected={o === current}
							className={cn(
								'flex cursor-pointer items-baseline justify-between gap-2 rounded-md px-2 py-1 text-xs',
								i === active && 'bg-accent',
								o === current && 'font-semibold'
							)}
							// Keeps the input focused while clicking
							onMouseDown={(e) => e.preventDefault()}
							onMouseEnter={() => setActive(i)}
							onClick={() => choose(o)}
						>
							<span>{o}</span>
							{pxHint(prefix, o) && (
								<span className='text-muted-foreground text-[10px] font-normal'>
									{pxHint(prefix, o)}
								</span>
							)}
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	)
}

function Swatch({
	token,
	color: given,
	selected,
	dim,
	onClick,
}: {
	token: string
	color?: string
	selected: boolean
	dim: boolean
	onClick: () => void
}) {
	const vars = useSiteThemeVars()
	const color = given ?? vars[`--color-${token}`]
	// The hint must not cover neighbour swatches: it ignores the pointer and closes once it leaves the swatch
	return (
		<Tooltip delayDuration={150} disableHoverableContent>
			<TooltipTrigger asChild>
				<button
					type='button'
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
			</TooltipTrigger>
			<TooltipContent
				sideOffset={6}
				className='pointer-events-none font-mono'
			>
				{color ? `${token} \u00b7 ${color}` : token}
			</TooltipContent>
		</Tooltip>
	)
}

// Any color as an arbitrary class like bg-[#1e90ff] or a palette class
function CustomColor({
	state,
	prefix,
	text,
	css,
	index,
}: {
	state: RowState
	prefix: string
	text: string | null
	css: string | null
	index: ClassIndex | null
}) {
	const [draft, setDraft] = useState<{ from: string; text: string } | null>(
		null
	)
	const set = text !== null
	const shown =
		draft && draft.from === (text ?? '') ? draft.text : (text ?? '')
	const apply = (value: string) =>
		state.set(customColorUtility(prefix, value))
	const commit = (input: string) => {
		setDraft(null)
		const palette = paletteUtility(prefix, input)
		if (palette) {
			if (index?.colorOf(palette) && palette !== state.value)
				state.set(palette)
			return
		}
		const value = normalizeColor(input) ?? normalizeHex(input)
		if (value && value !== text) apply(value)
	}
	return (
		<div className='flex min-w-0 items-center gap-1.5'>
			<Tooltip delayDuration={150}>
				<TooltipTrigger asChild>
					<label
						className={cn(
							'border-border relative flex size-5 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border',
							set && 'ring-ring ring-2 ring-offset-1',
							set && state.inherited && 'opacity-60'
						)}
						style={{ background: css ?? undefined }}
					>
						{!css && (
							<PipetteIcon className='text-muted-foreground size-3' />
						)}
						<input
							type='color'
							aria-label={t('style.customColorOf', { prefix })}
							value={(css && colorForPicker(css)) || '#000000'}
							className='absolute inset-0 size-full cursor-pointer opacity-0'
							onChange={(e) => apply(e.target.value)}
						/>
					</label>
				</TooltipTrigger>
				<TooltipContent>{t('style.customColor')}</TooltipContent>
			</Tooltip>
			<input
				value={shown}
				placeholder='#hex, rgb(), oklch()'
				aria-label={t('style.hexOf', { prefix })}
				autoComplete='off'
				spellCheck={false}
				className='border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-6 w-32 min-w-0 rounded-md border px-1.5 font-mono text-xs outline-none focus-visible:ring-3'
				onChange={(e) =>
					setDraft({ from: text ?? '', text: e.target.value })
				}
				onBlur={(e) => commit(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') commit(e.currentTarget.value)
					if (e.key === 'Escape') setDraft(null)
				}}
			/>
		</div>
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
	const classIndex = useClassIndex()
	const themeVars = useSiteThemeVars()
	const index = classIndex.status === 'ready' ? classIndex.index : null
	const custom = state.value ? parseCustomColor(state.value, prefix) : null
	const palette = state.value ? parsePaletteColor(state.value, prefix) : null
	const customText = custom ?? palette
	const rawCss = custom
		? customColorCss(custom)
		: palette && state.value
			? index?.colorOf(state.value)
			: null
	const customCss = rawCss ? resolveVars(rawCss, themeVars) : null
	const siteColors = useTokenColors()
	const token =
		current && (isColorToken(current.token) || current.token in siteColors)
			? current
			: null
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex flex-wrap gap-1.5'>
				{COLOR_TOKENS.map((name) => (
					<Swatch
						key={name}
						token={name}
						selected={token?.token === name}
						dim={state.inherited}
						onClick={() =>
							state.set(
								token?.token === name && !state.inherited
									? null
									: colorUtility(
											prefix,
											name,
											token?.opacity ?? null
										)
							)
						}
					/>
				))}
				{Object.entries(siteColors).map(([name, color], i) => (
					<Fragment key={name}>
						{i === 0 && <span className='bg-border mx-0.5 w-px' />}
						<Swatch
							token={name}
							color={color}
							selected={token?.token === name}
							dim={state.inherited}
							onClick={() =>
								state.set(
									token?.token === name && !state.inherited
										? null
										: colorUtility(
												prefix,
												name,
												token?.opacity ?? null
											)
								)
							}
						/>
					</Fragment>
				))}
			</div>
			<div className='flex items-center gap-2'>
				<select
					aria-label={t('style.opacityOf', { prefix })}
					disabled={!token}
					value={token?.opacity ?? ''}
					className='border-input bg-background h-6 rounded-md border px-1 text-xs disabled:opacity-50'
					onChange={(e) =>
						token &&
						state.set(
							colorUtility(
								prefix,
								token.token,
								e.target.value ? Number(e.target.value) : null
							)
						)
					}
				>
					<option value=''>{t('style.opacityN', { n: 100 })}</option>
					{OPACITY_STEPS.slice(1).map((o) => (
						<option key={o} value={o}>
							{t('style.opacityN', { n: o })}
						</option>
					))}
				</select>
				<CustomColor
					state={state}
					prefix={prefix}
					text={customText}
					css={customCss}
					index={index}
				/>
			</div>
			{current && !token && !customText && (
				<span className='text-muted-foreground truncate font-mono text-[10px]'>
					{state.value}
				</span>
			)}
		</div>
	)
}
