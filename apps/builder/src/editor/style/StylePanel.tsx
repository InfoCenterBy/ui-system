import { useEffect, useState, type ReactNode } from 'react'
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	ChevronDownIcon,
	ChevronRightIcon,
} from 'lucide-react'
import {
	BREAKPOINTS,
	breakpointFor,
	type Breakpoint,
	resolveUtility,
	setUtility,
	type ElementNode,
	type UtilityGroup,
} from '@ui-system/core'
import { cn } from 'cn'
import { useStyleTarget, targetHint, targetLabel } from '@/editor/style/target'
import { useProject } from '@/store/project'
import { setClasses } from '@/store/actions'
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
import { FRACTIONS, SPACING_STEPS } from '@/editor/style/values'
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

const SPACING = [...SPACING_STEPS] as string[]
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

function Section({
	title,
	children,
	open: initial = true,
}: {
	title: string
	children: ReactNode
	open?: boolean
}) {
	const [open, setOpen] = useState(initial)
	const Icon = open ? ChevronDownIcon : ChevronRightIcon
	return (
		<section className='border-t'>
			<button
				type='button'
				aria-expanded={open}
				className='hover:bg-muted/50 flex w-full items-center gap-1 px-3 py-2 text-xs font-medium'
				onClick={() => setOpen(!open)}
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

function Layout({ ctx }: { ctx: StyleContext }) {
	const display = resolveUtility(ctx.classes, 'display', ctx.bp)?.utility
	const isFlex = display === 'flex' || display === 'inline-flex'
	const isGrid = display === 'grid' || display === 'inline-grid'
	return (
		<Section title={t('style.layout')}>
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
					<StyleRow
						ctx={ctx}
						group='grid-cols'
						label={t('style.columns')}
					>
						{(state) => (
							<Choose
								state={state}
								options={choices('grid-cols', [
									'1',
									'2',
									'3',
									'4',
									'5',
									'6',
									'12',
								])}
							/>
						)}
					</StyleRow>
					<JustifyRow ctx={ctx} />
					<StyleRow
						ctx={ctx}
						group='justify-items'
						label={t('style.itemsX')}
					>
						{(state) => (
							<Choose
								state={state}
								options={choices('justify-items', [
									'start',
									'center',
									'end',
									'stretch',
								])}
							/>
						)}
					</StyleRow>
					<AlignRow ctx={ctx} label={t('style.itemsY')} />
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
		<Section title={t('style.spacing')}>
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
		<Section title={t('style.size')}>
			{row('width', t('style.width'), 'w', WIDTHS, maxWidthNote(ctx))}
			{row('max-width', t('style.maxWidth'), 'max-w', MAX_WIDTHS)}
			{row('height', t('style.height'), 'h', HEIGHTS)}
			{row('min-height', t('style.minHeight'), 'min-h', MIN_HEIGHTS)}
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
		<Section title={t('style.typography')}>
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
		<Section title={t('style.background')}>
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

function Effects({ ctx }: { ctx: StyleContext }) {
	return (
		<Section title={t('style.effects')}>
			<StyleRow ctx={ctx} group='radius' label={t('style.radius')}>
				{(state) => (
					<Choose state={state} options={choices('rounded', RADII)} />
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

// Style controls write classes at the chosen target, All screens by default
export function StylePanel({ node }: { node: ElementNode }) {
	const width = useProject((s) => s.canvasWidth)
	const { target, setTarget } = useStyleTarget()
	const canvasBp = breakpointFor(width)
	const hint = targetHint(target, width)
	const ctx: StyleContext = {
		id: node.id,
		classes: node.classes,
		bp: target,
		canvasBp,
	}
	return (
		<div className='flex flex-col'>
			<div className='flex flex-col gap-1.5 px-3 py-2'>
				<div className='flex items-center justify-between gap-2'>
					<span className='text-xs font-medium'>
						{t('style.title')}
					</span>
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
				<p
					className={cn(
						'text-xs',
						hint.warn
							? 'text-amber-600 dark:text-amber-400'
							: 'text-muted-foreground'
					)}
				>
					{hint.text}
				</p>
			</div>
			<Layout ctx={ctx} />
			<Spacing ctx={ctx} />
			<Size ctx={ctx} />
			<Typography ctx={ctx} />
			<Background ctx={ctx} />
			<Effects ctx={ctx} />
		</div>
	)
}
