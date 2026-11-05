import { useEffect, useState, type ReactNode } from 'react'
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	ChevronDownIcon,
	ChevronsDownUpIcon,
	ChevronsUpDownIcon,
	ChevronRightIcon,
	CopyIcon,
	ItalicIcon,
	StrikethroughIcon,
	UnderlineIcon,
} from 'lucide-react'
import {
	BREAKPOINTS,
	GROUP_CLASS,
	ancestorsOf,
	hasGroupClass,
	parseClass,
	splitClasses,
	breakpointFor,
	repeatPath,
	usedStates,
	type Breakpoint,
	type State,
	resolveUtility,
	setUtility,
	tokenNamesFor,
	type ElementNode,
	type UtilityGroup,
} from '@ui-system/core'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { useStyleTarget, targetHint, targetLabel } from '@/editor/style/target'
import { useProject } from '@/store/project'
import { applyStylesToItems, setClasses } from '@/store/actions'
import { useRoots } from '@/editor/canvas/useRoots'
import { labelOf, scopeOf } from '@/editor/canvas/nodes'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { alignCompanion, applyAlign, readLayout } from '@/editor/style/align'
import {
	Choose,
	ColorSwatches,
	Segmented,
	StyleRow,
	ValueInput,
	type Choice,
	type StyleContext,
} from '@/editor/style/controls'
import { useSiteTokens } from '@/editor/style/useSiteTokens'
import { FRACTIONS, SPACING_STEPS } from '@/editor/style/values'
import { GridSection } from '@/editor/style/GridSection'
import { ColumnSection } from '@/editor/style/ColumnSection'
import { ScreenTable } from '@/editor/style/ScreenTable'
import { utilityCell } from '@/editor/style/screens'
import { t } from '@/i18n'

const choices = (prefix: string, names: string[]): Choice[] =>
	names.map((name) => ({ value: `${prefix}-${name}`, label: name }))

const SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']
const FONT_SIZES = [...SIZES, '5xl', '6xl', '7xl', '8xl', '9xl']
const WEIGHTS = [
	'thin',
	'extralight',
	'light',
	'normal',
	'medium',
	'semibold',
	'bold',
	'extrabold',
	'black',
]
const LEADINGS = ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose']
const RADII = [
	'none',
	'sm',
	'md',
	'lg',
	'xl',
	'2xl',
	'full',
	'box',
	'field',
	'selector',
]
const SHADOWS = ['none', 'sm', 'md', 'lg', 'xl', '2xl']
const OPACITIES = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100]
const MAX_WIDTHS = [
	'xs',
	'sm',
	'md',
	'lg',
	'xl',
	'2xl',
	'3xl',
	'4xl',
	'5xl',
	'6xl',
	'7xl',
	'none',
	'full',
	'prose',
]

const TRACKINGS = ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']
const Z_INDEXES = ['auto', '0', '10', '20', '30', '40', '50']
const OVERFLOWS = ['visible', 'hidden', 'auto', 'scroll', 'clip']
const OBJECT_FITS = ['cover', 'contain', 'fill', 'none', 'scale-down']
const OBJECT_POSITIONS = [
	'center',
	'top',
	'bottom',
	'left',
	'right',
	'left-top',
	'right-top',
	'left-bottom',
	'right-bottom',
]
const POSITIONS = ['static', 'relative', 'absolute', 'fixed', 'sticky']
const BORDER_WIDTHS = [
	['border-0', '0'],
	['border', '1'],
	['border-2', '2'],
	['border-4', '4'],
	['border-8', '8'],
]
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double', 'none']
const GRADIENT_DIRECTIONS = ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl']

const SPACING = [...SPACING_STEPS] as string[]
const INSETS = [...new Set(['auto', 'full', '1/2', ...SPACING])]
const MARGIN_STEPS = [...SPACING, 'auto']
const WIDTHS = ['auto', 'full', 'fit', 'screen', ...FRACTIONS, ...SPACING]
const HEIGHTS = ['auto', 'full', 'fit', 'screen', ...SPACING]
const MIN_HEIGHTS = ['screen', 'full', 'fit', ...SPACING]

// Built on render: the texts follow the current language
const displayChoices = (): Choice[] => [
	{ value: 'block', label: 'Block' },
	{ value: 'flex', label: 'Flex' },
	{ value: 'grid', label: 'Grid' },
	{ value: 'hidden', label: t('style.hidden') },
]

const alignChoices = (): Choice[] => [
	{
		value: 'text-left',
		label: <AlignLeftIcon className='size-3.5' />,
		title: t('style.alignLeft'),
	},
	{
		value: 'text-center',
		label: <AlignCenterIcon className='size-3.5' />,
		title: t('style.alignCenter'),
	},
	{
		value: 'text-right',
		label: <AlignRightIcon className='size-3.5' />,
		title: t('style.alignRight'),
	},
	{
		value: 'text-justify',
		label: <AlignJustifyIcon className='size-3.5' />,
		title: t('style.alignJustify'),
	},
]

const OPEN_KEY = 'builder.style.open'

const readOpen = (): Record<string, boolean> => {
	try {
		return JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}') ?? {}
	} catch {
		return {}
	}
}

const saveOpen = (id: string, open: boolean) => {
	try {
		localStorage.setItem(
			OPEN_KEY,
			JSON.stringify({ ...readOpen(), [id]: open })
		)
	} catch {
		// Storage can be blocked, the group just does not remember
	}
}

const OPEN_ALL_EVENT = 'builder:style-open-all'

// Collapsible group, the open state is remembered per group
export function Section({
	id,
	title,
	children,
	open: initial = true,
}: {
	id: string
	title: string
	children: ReactNode
	open?: boolean
}) {
	const [open, setOpen] = useState(() => readOpen()[id] ?? initial)
	// The collapse and expand all button reaches every group by this event
	useEffect(() => {
		const onAll = (e: Event) => {
			const next = (e as CustomEvent<boolean>).detail
			setOpen(next)
			saveOpen(id, next)
		}
		window.addEventListener(OPEN_ALL_EVENT, onAll)
		return () => window.removeEventListener(OPEN_ALL_EVENT, onAll)
	}, [id])
	const Icon = open ? ChevronDownIcon : ChevronRightIcon
	return (
		<section className='border-t'>
			<button
				type='button'
				aria-expanded={open}
				className='hover:bg-muted/50 flex w-full items-center gap-1 px-3 py-2 text-xs font-medium'
				onClick={() => {
					setOpen(!open)
					saveOpen(id, !open)
				}}
			>
				<Icon className='size-3.5' />
				{title}
			</button>
			{open && (
				<div className='flex flex-col gap-2.5 px-3 pb-3'>
					{children}
				</div>
			)}
		</section>
	)
}

// Padding or margin with one value, x and y, or every side
function BoxEditor({
	ctx,
	kind,
}: {
	ctx: StyleContext
	kind: 'padding' | 'margin'
}) {
	const p = kind === 'padding' ? 'p' : 'm'
	const groups = {
		all: [[kind, t('style.all'), p]],
		xy: [
			[`${kind}-x`, 'X', `${p}x`],
			[`${kind}-y`, 'Y', `${p}y`],
		],
		sides: [
			[`${kind}-top`, t('style.top'), `${p}t`],
			[`${kind}-right`, t('style.right'), `${p}r`],
			[`${kind}-bottom`, t('style.bottom'), `${p}b`],
			[`${kind}-left`, t('style.left'), `${p}l`],
		],
	} as const
	const used = (names: readonly (readonly [string, string, string])[]) =>
		names.some(
			([group]) =>
				resolveUtility(ctx.classes, group as UtilityGroup, ctx.bp) !==
				null
		)
	const initial = used(groups.sides)
		? 'sides'
		: used(groups.xy)
			? 'xy'
			: 'all'
	const [picked, setPicked] = useState<keyof typeof groups | null>(null)
	const mode = picked ?? initial
	const steps = kind === 'margin' ? MARGIN_STEPS : SPACING
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2'>
				<span className='text-muted-foreground w-[6.25rem] truncate text-xs'>
					{kind === 'padding'
						? t('style.padding')
						: t('style.margin')}
				</span>
				<div className='border-input flex flex-1 overflow-hidden rounded-lg border'>
					{(
						[
							['all', t('style.all')],
							['xy', 'X / Y'],
							['sides', t('style.sides')],
						] as const
					).map(([key, label]) => (
						<button
							key={key}
							type='button'
							aria-pressed={mode === key}
							className={`h-6 flex-1 text-xs not-first:border-l ${
								mode === key
									? 'text-secondary-foreground bg-secondary'
									: 'hover:bg-muted'
							}`}
							onClick={() => setPicked(key)}
						>
							{label}
						</button>
					))}
				</div>
			</div>
			{groups[mode].map(([group, label, prefix]) => (
				<StyleRow
					key={group}
					ctx={ctx}
					group={group as UtilityGroup}
					label={label}
				>
					{(state) => (
						<ValueInput
							state={state}
							prefix={prefix}
							options={steps}
							negative={kind === 'margin'}
						/>
					)}
				</StyleRow>
			))}
		</div>
	)
}

function GapRow({ ctx }: { ctx: StyleContext }) {
	return (
		<StyleRow ctx={ctx} group='gap' label={t('style.gap')}>
			{(state) => (
				<ValueInput state={state} prefix='gap' options={SPACING} />
			)}
		</StyleRow>
	)
}

function JustifyRow({ ctx }: { ctx: StyleContext }) {
	return (
		<StyleRow ctx={ctx} group='justify-content' label={t('style.justify')}>
			{(state) => (
				<Choose
					state={state}
					options={choices('justify', [
						'start',
						'center',
						'end',
						'between',
						'around',
						'evenly',
					])}
				/>
			)}
		</StyleRow>
	)
}

function AlignRow({
	ctx,
	label = t('style.align'),
}: {
	ctx: StyleContext
	label?: string
}) {
	return (
		<StyleRow ctx={ctx} group='align-items' label={label}>
			{(state) => (
				<Choose
					state={state}
					options={choices('items', [
						'start',
						'center',
						'end',
						'stretch',
						'baseline',
					])}
				/>
			)}
		</StyleRow>
	)
}

const DISPLAYS = [
	'block',
	'flex',
	'grid',
	'inline',
	'inline-block',
	'inline-flex',
	'hidden',
]

// Display at every screen at once, hidden on one screen is how per-screen visibility is set
function DisplayScreens({ ctx }: { ctx: StyleContext }) {
	if (ctx.state) return null
	return (
		<div className='flex flex-col gap-1'>
			<span className='text-muted-foreground text-xs'>
				{t('style.displayScreens')}
			</span>
			<ScreenTable
				name={t('style.displayScreens')}
				active={ctx.canvasBp}
				rows={[
					{
						options: DISPLAYS.map((value) => ({
							value,
							label:
								value === 'hidden' ? t('style.hidden') : value,
						})),
						cell: (bp) => utilityCell(ctx.classes, 'display', bp),
						onChange: (bp, value) =>
							setClasses(
								ctx.id,
								setUtility(ctx.classes, 'display', bp, value)
							),
					},
				]}
			/>
		</div>
	)
}

function Layout({ ctx }: { ctx: StyleContext }) {
	const display = resolveUtility(ctx.classes, 'display', ctx.bp)?.utility
	const isFlex = display === 'flex' || display === 'inline-flex'
	const isGrid = display === 'grid' || display === 'inline-grid'
	return (
		<Section id='layout' title={t('style.layout')}>
			<DisplayScreens ctx={ctx} />
			<StyleRow
				ctx={ctx}
				group='display'
				label={t('style.display')}
				stacked
			>
				{(state) => (
					<Segmented state={state} options={displayChoices()} />
				)}
			</StyleRow>
			{isFlex && (
				<>
					<StyleRow
						ctx={ctx}
						group='flex-direction'
						label={t('style.direction')}
					>
						{(state) => (
							<Segmented
								state={state}
								options={[
									{
										value: 'flex-row',
										label: t('style.row'),
									},
									{
										value: 'flex-col',
										label: t('style.column'),
									},
								]}
							/>
						)}
					</StyleRow>
					<StyleRow
						ctx={ctx}
						group='flex-wrap'
						label={t('style.wrap')}
					>
						{(state) => (
							<Segmented
								state={state}
								options={[
									{
										value: 'flex-nowrap',
										label: t('style.noWrap'),
									},
									{
										value: 'flex-wrap',
										label: t('style.wrapOn'),
									},
								]}
							/>
						)}
					</StyleRow>
					<JustifyRow ctx={ctx} />
					<AlignRow ctx={ctx} />
					<GapRow ctx={ctx} />
				</>
			)}
			{isGrid && (
				<>
					<JustifyRow ctx={ctx} />
					<StyleRow
						ctx={ctx}
						group='place-items'
						label={t('style.placeItems')}
					>
						{(state) => (
							<Choose
								state={state}
								options={choices('place-items', [
									'start',
									'center',
									'end',
									'stretch',
									'baseline',
								])}
							/>
						)}
					</StyleRow>
					<GapRow ctx={ctx} />
				</>
			)}
		</Section>
	)
}

function Spacing({ ctx }: { ctx: StyleContext }) {
	return (
		<Section id='spacing' title={t('style.spacing')}>
			<BoxEditor ctx={ctx} kind='padding' />
			<BoxEditor ctx={ctx} kind='margin' />
		</Section>
	)
}

// A max width stops "full" and other widths from growing past it
function maxWidthNote(ctx: StyleContext) {
	const width = resolveUtility(ctx.classes, 'width', ctx.bp)
	const max = resolveUtility(ctx.classes, 'max-width', ctx.bp)
	if (!width || !max || ['max-w-none', 'max-w-full'].includes(max.utility))
		return undefined
	return (
		<span className='flex flex-wrap items-center gap-x-1'>
			<span>{t('style.maxWidthLimits', { value: max.utility })}</span>
			<button
				type='button'
				className='text-primary underline'
				onClick={() =>
					setClasses(
						ctx.id,
						setUtility(ctx.classes, 'max-width', max.from, null)
					)
				}
			>
				{t('style.removeMaxWidth')}
			</button>
		</span>
	)
}

function Size({ ctx }: { ctx: StyleContext }) {
	const row = (
		group: UtilityGroup,
		label: string,
		prefix: string,
		options: readonly string[],
		note?: ReactNode
	) => (
		<StyleRow ctx={ctx} group={group} label={label} note={note}>
			{(state) => (
				<ValueInput state={state} prefix={prefix} options={options} />
			)}
		</StyleRow>
	)
	return (
		<Section id='size' title={t('style.size')}>
			{row('width', t('style.width'), 'w', WIDTHS, maxWidthNote(ctx))}
			{row('max-width', t('style.maxWidth'), 'max-w', MAX_WIDTHS)}
			{row('height', t('style.height'), 'h', HEIGHTS)}
			{row('min-height', t('style.minHeight'), 'min-h', MIN_HEIGHTS)}
			<StyleRow ctx={ctx} group='aspect-ratio' label={t('style.aspect')}>
				{(state) => (
					<Choose
						state={state}
						options={[
							{ value: 'aspect-auto', label: 'auto' },
							{
								value: 'aspect-square',
								label: t('style.square'),
							},
							{ value: 'aspect-video', label: t('style.video') },
						]}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='object-fit' label={t('style.objectFit')}>
				{(state) => (
					<Choose
						state={state}
						options={choices('object', OBJECT_FITS)}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='object-position'
				label={t('style.objectPosition')}
			>
				{(state) => (
					<Choose
						state={state}
						options={choices('object', OBJECT_POSITIONS)}
					/>
				)}
			</StyleRow>
		</Section>
	)
}

// Align also writes a companion utility so the text visibly moves
function TextAlignRow({ ctx }: { ctx: StyleContext }) {
	const doc = useCanvas((s) => s.doc)
	const [hint, setHint] = useState<string | null>(null)
	const current =
		resolveUtility(ctx.classes, 'text-align', ctx.bp)?.utility ??
		'text-left'
	useEffect(() => {
		// Wait for the canvas to render the new classes
		const frame = requestAnimationFrame(() => {
			const layout = readLayout(doc, ctx.id)
			const c = layout && alignCompanion(layout, current)
			setHint(c && 'hint' in c ? c.hint : null)
		})
		return () => cancelAnimationFrame(frame)
	}, [doc, ctx.id, ctx.classes, ctx.bp, current])
	return (
		<StyleRow
			ctx={ctx}
			group='text-align'
			label={t('style.align')}
			note={hint}
			apply={(utility, at) =>
				applyAlign(
					ctx.classes,
					at,
					utility,
					readLayout(useCanvas.getState().doc, ctx.id)
				)
			}
		>
			{(state) => <Segmented state={state} options={alignChoices()} />}
		</StyleRow>
	)
}

function Typography({ ctx }: { ctx: StyleContext }) {
	return (
		<Section id='typography' title={t('style.typography')}>
			<StyleRow
				ctx={ctx}
				group='font-family'
				label={t('style.fontFamily')}
			>
				{(state) => (
					<Choose
						state={state}
						options={[
							{ value: 'font-sans', label: t('style.fontBody') },
							{
								value: 'font-heading',
								label: t('style.fontHeading'),
							},
							{
								value: 'font-serif',
								label: t('style.fontSerif'),
							},
							{ value: 'font-mono', label: t('style.fontMono') },
						]}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='font-size' label={t('style.fontSize')}>
				{(state) => (
					<ValueInput
						state={state}
						prefix='text'
						options={FONT_SIZES}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='font-weight' label={t('style.weight')}>
				{(state) => (
					<Choose state={state} options={choices('font', WEIGHTS)} />
				)}
			</StyleRow>
			<TextAlignRow ctx={ctx} />
			<StyleRow
				ctx={ctx}
				group='line-height'
				label={t('style.lineHeight')}
			>
				{(state) => (
					<Choose
						state={state}
						options={choices('leading', LEADINGS)}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='letter-spacing'
				label={t('style.letterSpacing')}
			>
				{(state) => (
					<Choose
						state={state}
						options={choices('tracking', TRACKINGS)}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='text-transform'
				label={t('style.textTransform')}
			>
				{(state) => (
					<Choose
						state={state}
						options={[
							{ value: 'uppercase', label: t('style.uppercase') },
							{ value: 'lowercase', label: t('style.lowercase') },
							{
								value: 'capitalize',
								label: t('style.capitalize'),
							},
							{
								value: 'normal-case',
								label: t('style.normalCase'),
							},
						]}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='font-style' label={t('style.italic')}>
				{(state) => (
					<Segmented
						state={state}
						options={[
							{
								value: 'italic',
								label: <ItalicIcon className='size-3.5' />,
								title: t('style.italic'),
							},
						]}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='text-decoration'
				label={t('style.underline')}
			>
				{(state) => (
					<Segmented
						state={state}
						options={[
							{
								value: 'underline',
								label: <UnderlineIcon className='size-3.5' />,
								title: t('style.underline'),
							},
							{
								value: 'line-through',
								label: (
									<StrikethroughIcon className='size-3.5' />
								),
								title: t('style.lineThrough'),
							},
						]}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='text-color'
				label={t('style.color')}
				stacked
			>
				{(state) => <ColorSwatches state={state} prefix='text' />}
			</StyleRow>
		</Section>
	)
}

function Background({ ctx }: { ctx: StyleContext }) {
	return (
		<Section id='background' title={t('style.background')}>
			<StyleRow
				ctx={ctx}
				group='background-color'
				label={t('style.color')}
				stacked
			>
				{(state) => <ColorSwatches state={state} prefix='bg' />}
			</StyleRow>
		</Section>
	)
}

function Position({ ctx }: { ctx: StyleContext }) {
	const inset = (
		group: 'top' | 'right' | 'bottom' | 'left',
		label: string
	) => (
		<StyleRow ctx={ctx} group={group} label={label}>
			{(state) => (
				<ValueInput
					state={state}
					prefix={group}
					options={INSETS}
					negative
				/>
			)}
		</StyleRow>
	)
	const overflow = (
		group: 'overflow' | 'overflow-x' | 'overflow-y',
		label: string
	) => (
		<StyleRow ctx={ctx} group={group} label={label}>
			{(state) => (
				<Choose state={state} options={choices(group, OVERFLOWS)} />
			)}
		</StyleRow>
	)
	return (
		<Section id='position' title={t('style.position')} open={false}>
			<StyleRow ctx={ctx} group='position' label={t('style.position')}>
				{(state) => (
					<Choose
						state={state}
						options={POSITIONS.map((name) => ({
							value: name,
							label: name,
						}))}
					/>
				)}
			</StyleRow>
			{inset('top', t('style.top'))}
			{inset('right', t('style.right'))}
			{inset('bottom', t('style.bottom'))}
			{inset('left', t('style.left'))}
			<StyleRow ctx={ctx} group='z-index' label={t('style.zIndex')}>
				{(state) => (
					<Choose state={state} options={choices('z', Z_INDEXES)} />
				)}
			</StyleRow>
			{overflow('overflow', t('style.overflow'))}
			{overflow('overflow-x', t('style.overflowX'))}
			{overflow('overflow-y', t('style.overflowY'))}
		</Section>
	)
}

function Gradient({ ctx }: { ctx: StyleContext }) {
	return (
		<Section id='gradient' title={t('style.gradient')} open={false}>
			<StyleRow
				ctx={ctx}
				group='gradient-direction'
				label={t('style.gradientDirection')}
			>
				{(state) => (
					<Choose
						state={state}
						options={GRADIENT_DIRECTIONS.map((d) => ({
							value: `bg-linear-to-${d}`,
							label: `to ${d}`,
						}))}
					/>
				)}
			</StyleRow>
			{(
				[
					['gradient-from', 'from', t('style.gradientFrom')],
					['gradient-via', 'via', t('style.gradientVia')],
					['gradient-to', 'to', t('style.gradientTo')],
				] as const
			).map(([group, prefix, label]) => (
				<StyleRow
					key={group}
					ctx={ctx}
					group={group}
					label={label}
					stacked
				>
					{(state) => <ColorSwatches state={state} prefix={prefix} />}
				</StyleRow>
			))}
		</Section>
	)
}

function Effects({ ctx }: { ctx: StyleContext }) {
	const tokens = useSiteTokens()
	return (
		<Section id='effects' title={t('style.effects')} open={false}>
			<StyleRow
				ctx={ctx}
				group='border-width'
				label={t('style.borderWidth')}
			>
				{(state) => (
					<Choose
						state={state}
						options={BORDER_WIDTHS.map(([value, label]) => ({
							value,
							label,
						}))}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='border-style'
				label={t('style.borderStyle')}
			>
				{(state) => (
					<Choose
						state={state}
						options={choices('border', BORDER_STYLES)}
					/>
				)}
			</StyleRow>
			<StyleRow
				ctx={ctx}
				group='border-color'
				label={t('style.borderColor')}
				stacked
			>
				{(state) => <ColorSwatches state={state} prefix='border' />}
			</StyleRow>
			<StyleRow ctx={ctx} group='radius' label={t('style.radius')}>
				{(state) => (
					<Choose
						state={state}
						options={choices('rounded', [
							...RADII,
							...tokenNamesFor(tokens, 'rounded'),
						])}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='shadow' label={t('style.shadow')}>
				{(state) => (
					<Choose
						state={state}
						options={choices('shadow', SHADOWS)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='opacity' label={t('style.opacity')}>
				{(state) => (
					<Choose
						state={state}
						options={choices('opacity', OPACITIES.map(String))}
					/>
				)}
			</StyleRow>
		</Section>
	)
}

const TRANSITIONS: [string, string][] = [
	['transition-none', 'style.transitionNone'],
	['transition', 'style.transitionCommon'],
	['transition-colors', 'style.transitionColors'],
	['transition-opacity', 'style.transitionOpacity'],
	['transition-shadow', 'style.transitionShadow'],
	['transition-transform', 'style.transitionTransform'],
	['transition-all', 'style.transitionAll'],
]
const DURATIONS = ['75', '100', '150', '200', '300', '500', '700', '1000']
const EASINGS: [string, string][] = [
	['ease-linear', 'style.easeLinear'],
	['ease-in', 'style.easeIn'],
	['ease-out', 'style.easeOut'],
	['ease-in-out', 'style.easeInOut'],
]
const DELAYS = ['0', '75', '100', '150', '200', '300', '500', '700', '1000']
const SCALES = ['50', '75', '90', '95', '100', '105', '110', '125', '150']
const MOVES = ['0', '0.5', '1', '2', '3', '4', '6', '8']
const ROTATIONS = ['0', '1', '2', '3', '6', '12', '45', '90', '180']
// Goes on the normal state so a hover change animates both ways
const SMOOTH_CLASSES = 'transition duration-200 ease-out'

const ms = (prefix: string, values: string[]): Choice[] =>
	values.map((v) => ({
		value: `${prefix}-${v}`,
		label: t('style.ms', { n: v }),
	}))

// Negative then positive steps of a signed utility, e.g. -rotate-3 and rotate-3
const signed = (
	prefix: string,
	values: string[],
	unit: (v: string) => string
): Choice[] => [
	...values
		.slice(1)
		.reverse()
		.map((v) => ({ value: `-${prefix}-${v}`, label: `-${unit(v)}` })),
	...values.map((v) => ({ value: `${prefix}-${v}`, label: unit(v) })),
]

const px = (v: string) => `${Number(v) * 4}px`

const addClass = (classes: string, name: string) =>
	[classes, name].filter(Boolean).join(' ')

// Transforms follow the chosen state, the transition itself always sits on the normal state
function Motion({ ctx }: { ctx: StyleContext }) {
	const base: StyleContext = { ...ctx, state: '' }
	return (
		<Section id='motion' title={t('style.motion')}>
			<StyleRow ctx={ctx} group='scale' label={t('style.scale')}>
				{(state) => (
					<Choose
						state={state}
						options={SCALES.map((v) => ({
							value: `scale-${v}`,
							label: `${v}%`,
						}))}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='translate-y' label={t('style.moveY')}>
				{(state) => (
					<Choose
						state={state}
						options={signed('translate-y', MOVES, px)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='translate-x' label={t('style.moveX')}>
				{(state) => (
					<Choose
						state={state}
						options={signed('translate-x', MOVES, px)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='rotate' label={t('style.rotate')}>
				{(state) => (
					<Choose
						state={state}
						options={signed('rotate', ROTATIONS, (v) => `${v}°`)}
					/>
				)}
			</StyleRow>
			<p className='text-muted-foreground text-xs'>
				{t('style.transitionNote')}
			</p>
			<StyleRow
				ctx={base}
				group='transition'
				label={t('style.transition')}
			>
				{(state) => (
					<Choose
						state={state}
						options={TRANSITIONS.map(([value, key]) => ({
							value,
							label: t(key as 'style.transitionNone'),
						}))}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={base} group='duration' label={t('style.duration')}>
				{(state) => (
					<Choose state={state} options={ms('duration', DURATIONS)} />
				)}
			</StyleRow>
			<StyleRow ctx={base} group='ease' label={t('style.easing')}>
				{(state) => (
					<Choose
						state={state}
						options={EASINGS.map(([value, key]) => ({
							value,
							label: t(key as 'style.easeLinear'),
						}))}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={base} group='delay' label={t('style.delay')}>
				{(state) => (
					<Choose state={state} options={ms('delay', DELAYS)} />
				)}
			</StyleRow>
			<GroupToggle ctx={ctx} />
		</Section>
	)
}

// The group class has no breakpoint or state, it only names the hover parent
function GroupToggle({ ctx }: { ctx: StyleContext }) {
	const on = hasGroupClass(ctx.classes)
	const toggle = () =>
		setClasses(
			ctx.id,
			on
				? splitClasses(ctx.classes)
						.filter((c) => c !== GROUP_CLASS)
						.join(' ')
				: addClass(ctx.classes, GROUP_CLASS)
		)
	return (
		<label className='flex items-start gap-2 text-xs'>
			<input
				type='checkbox'
				className='mt-0.5'
				checked={on}
				onChange={toggle}
			/>
			<span className='flex flex-col gap-0.5'>
				<span>{t('style.groupParent')}</span>
				<span className='text-muted-foreground'>
					{t('style.groupParentHint')}
				</span>
			</span>
		</label>
	)
}

// State changes jump without a transition, offer the usual one
function SmoothHint({ node }: { node: ElementNode }) {
	const smooth = splitClasses(node.classes).some((c) =>
		parseClass(c).utility.startsWith('transition')
	)
	if (smooth) return null
	return (
		<div className='flex items-center justify-between gap-2 text-xs'>
			<span className='text-muted-foreground'>
				{t('style.instantNote')}
			</span>
			<Button
				size='sm'
				variant='outline'
				className='h-6 shrink-0 px-2 text-xs'
				onClick={() =>
					setClasses(node.id, addClass(node.classes, SMOOTH_CLASSES))
				}
			>
				{t('style.makeSmooth')}
			</Button>
		</div>
	)
}

// Plain tags read better with their first class, div.card instead of div
const parentName = (node: ElementNode) => {
	const label = labelOf(node)
	const first = splitClasses(node.classes).find((c) => c !== GROUP_CLASS)
	return label === node.tag && first ? `${label}.${first}` : label
}

// group-hover: needs a parent with the group class, show it or let the user pick one
function GroupParentHint({ node }: { node: ElementNode }) {
	const roots = useRoots()
	const select = useProject((s) => s.select)
	const editing = useProject((s) => Boolean(s.editingComponentId))
	const ancestors = ancestorsOf(roots, node.id)
	const group = ancestors.findLast((a) => hasGroupClass(a.classes))
	if (group) {
		return (
			<p className='text-muted-foreground text-xs'>
				{t('style.groupIs')}{' '}
				<button
					type='button'
					className='text-foreground underline underline-offset-2'
					onClick={() => select(group.id)}
				>
					{parentName(group)}
				</button>
			</p>
		)
	}
	// Nearest parents first, only those whose classes can change
	const candidates = ancestors
		.filter((a) => scopeOf(roots, a.id, editing) === 'free' && !a.instance)
		.reverse()
		.slice(0, 6)
	return (
		<div className='flex flex-col gap-1 text-xs'>
			<span className='text-amber-600 dark:text-amber-400'>
				{t('style.noGroup')}
			</span>
			{candidates.length > 0 && (
				<select
					aria-label={t('style.makeGroup')}
					value=''
					className='border-input bg-background h-7 rounded-lg border px-1.5 text-xs'
					onChange={(e) => {
						const parent = candidates.find(
							(a) => a.id === e.target.value
						)
						if (parent) {
							setClasses(
								parent.id,
								addClass(parent.classes, GROUP_CLASS)
							)
						}
					}}
				>
					<option value=''>{t('style.makeGroup')}</option>
					{candidates.map((a) => (
						<option key={a.id} value={a.id}>
							{parentName(a)}
						</option>
					))}
				</select>
			)}
		</div>
	)
}

const stateOptions = (): { value: State; label: string }[] => [
	{ value: '', label: t('style.stateNone') },
	{ value: 'hover', label: t('style.stateHover') },
	{ value: 'focus', label: t('style.stateFocus') },
	{ value: 'active', label: t('style.stateActive') },
	{ value: 'group-hover', label: t('style.stateGroupHover') },
]

// Copies this node's classes to the same node in the other repeat items
function ApplyToItems({ id }: { id: string }) {
	const roots = useRoots()
	if (!repeatPath(roots, id)) return null
	return (
		<Button
			size='sm'
			variant='outline'
			className='w-fit'
			title={t('style.appliedToItems')}
			onClick={() => applyStylesToItems(id)}
		>
			<CopyIcon /> {t('style.applyToItems')}
		</Button>
	)
}

// Style controls write classes at the chosen target, All screens by default
export function StylePanel({ node }: { node: ElementNode }) {
	const [allOpen, setAllOpen] = useState(true)
	const width = useProject((s) => s.canvasWidth)
	const { target, setTarget, state, setState } = useStyleTarget()
	const canvasBp = breakpointFor(width)
	const hint = targetHint(target, width)
	const used = usedStates(node.classes)
	const options = stateOptions()
	const ctx: StyleContext = {
		id: node.id,
		classes: node.classes,
		bp: target,
		canvasBp,
		state,
	}
	return (
		<div className='flex flex-col'>
			<div className='bg-background sticky top-[var(--props-head,0px)] z-10 flex flex-col gap-1.5 border-b px-3 py-2'>
				<div className='flex items-center justify-between gap-2'>
					<div className='flex items-center gap-1'>
						<span className='text-xs font-medium'>
							{t('style.title')}
						</span>
						<button
							type='button'
							className='text-muted-foreground hover:text-foreground rounded p-1'
							title={
								allOpen
									? t('style.collapseAll')
									: t('style.expandAll')
							}
							aria-label={
								allOpen
									? t('style.collapseAll')
									: t('style.expandAll')
							}
							onClick={() => {
								setAllOpen(!allOpen)
								window.dispatchEvent(
									new CustomEvent(OPEN_ALL_EVENT, {
										detail: !allOpen,
									})
								)
							}}
						>
							{allOpen ? (
								<ChevronsDownUpIcon className='size-3.5' />
							) : (
								<ChevronsUpDownIcon className='size-3.5' />
							)}
						</button>
					</div>
					<label className='flex items-center gap-1.5 text-xs'>
						<span className='text-muted-foreground'>
							{t('style.appliesTo')}
						</span>
						<select
							aria-label={t('style.appliesTo')}
							value={target}
							className='border-input bg-background h-7 rounded-lg border px-1.5 text-xs'
							onChange={(e) =>
								setTarget(e.target.value as Breakpoint)
							}
						>
							{BREAKPOINTS.map((b) => (
								<option key={b.prefix} value={b.prefix}>
									{targetLabel(b.prefix)}
								</option>
							))}
						</select>
					</label>
				</div>
				<div
					role='group'
					aria-label={t('style.stateLabel')}
					className='border-input flex overflow-hidden rounded-lg border'
				>
					{options.map((option) => {
						const has =
							option.value !== '' && used.includes(option.value)
						return (
							<button
								key={option.value}
								type='button'
								aria-pressed={state === option.value}
								title={has ? t('style.stateUsed') : undefined}
								className={cn(
									'relative h-7 min-w-0 flex-1 truncate px-1 text-[11px] not-first:border-l',
									state === option.value
										? 'text-secondary-foreground bg-secondary'
										: 'hover:bg-muted'
								)}
								onClick={() => setState(option.value)}
							>
								{option.label}
								{has && (
									<span className='absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary' />
								)}
							</button>
						)
					})}
				</div>
				<p
					className={cn(
						'text-xs',
						hint.warn
							? 'text-amber-600 dark:text-amber-400'
							: 'text-muted-foreground'
					)}
				>
					{state
						? t('style.hintState', {
								state:
									options.find((o) => o.value === state)
										?.label ?? state,
							})
						: hint.text}
				</p>
				{state && <SmoothHint node={node} />}
				{state === 'group-hover' && <GroupParentHint node={node} />}
				<ApplyToItems id={node.id} />
			</div>
			<Layout ctx={ctx} />
			<GridSection ctx={ctx} />
			<ColumnSection ctx={ctx} />
			<Spacing ctx={ctx} />
			<Size ctx={ctx} />
			<Typography ctx={ctx} />
			<Background ctx={ctx} />
			<Gradient ctx={ctx} />
			<Position ctx={ctx} />
			<Effects ctx={ctx} />
			<Motion ctx={ctx} />
		</div>
	)
}
