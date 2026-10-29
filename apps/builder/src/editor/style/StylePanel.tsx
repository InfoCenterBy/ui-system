import { useState, type ReactNode } from 'react'
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
	resolveUtility,
	type ElementNode,
	type UtilityGroup,
} from '@ui-system/core'
import { useProject } from '@/store/project'
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

const DISPLAY: Choice[] = [
	{ value: 'block', label: 'Block' },
	{ value: 'flex', label: 'Flex' },
	{ value: 'grid', label: 'Grid' },
	{ value: 'hidden', label: 'Hidden' },
]

const ALIGNS: Choice[] = [
	{
		value: 'text-left',
		label: <AlignLeftIcon className='size-3.5' />,
		title: 'Left',
	},
	{
		value: 'text-center',
		label: <AlignCenterIcon className='size-3.5' />,
		title: 'Center',
	},
	{
		value: 'text-right',
		label: <AlignRightIcon className='size-3.5' />,
		title: 'Right',
	},
	{
		value: 'text-justify',
		label: <AlignJustifyIcon className='size-3.5' />,
		title: 'Justify',
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
		all: [[kind, 'All', p]],
		xy: [
			[`${kind}-x`, 'X', `${p}x`],
			[`${kind}-y`, 'Y', `${p}y`],
		],
		sides: [
			[`${kind}-top`, 'Top', `${p}t`],
			[`${kind}-right`, 'Right', `${p}r`],
			[`${kind}-bottom`, 'Bottom', `${p}b`],
			[`${kind}-left`, 'Left', `${p}l`],
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
				<span className='text-muted-foreground w-[4.25rem] text-xs capitalize'>
					{kind}
				</span>
				<div className='border-input flex flex-1 overflow-hidden rounded-lg border'>
					{(
						[
							['all', 'All'],
							['xy', 'X / Y'],
							['sides', 'Sides'],
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
		<StyleRow ctx={ctx} group='gap' label='Gap'>
			{(state) => (
				<ValueInput state={state} prefix='gap' options={SPACING} />
			)}
		</StyleRow>
	)
}

function Layout({ ctx }: { ctx: StyleContext }) {
	const display = resolveUtility(ctx.classes, 'display', ctx.bp)?.utility
	const isFlex = display === 'flex' || display === 'inline-flex'
	const isGrid = display === 'grid' || display === 'inline-grid'
	return (
		<Section title='Layout'>
			<StyleRow ctx={ctx} group='display' label='Display' stacked>
				{(state) => <Segmented state={state} options={DISPLAY} />}
			</StyleRow>
			{isFlex && (
				<>
					<StyleRow
						ctx={ctx}
						group='flex-direction'
						label='Direction'
					>
						{(state) => (
							<Segmented
								state={state}
								options={[
									{ value: 'flex-row', label: 'Row' },
									{ value: 'flex-col', label: 'Column' },
								]}
							/>
						)}
					</StyleRow>
					<StyleRow ctx={ctx} group='flex-wrap' label='Wrap'>
						{(state) => (
							<Segmented
								state={state}
								options={[
									{ value: 'flex-nowrap', label: 'No wrap' },
									{ value: 'flex-wrap', label: 'Wrap' },
								]}
							/>
						)}
					</StyleRow>
					<StyleRow ctx={ctx} group='justify-content' label='Justify'>
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
					<StyleRow ctx={ctx} group='align-items' label='Align'>
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
					<GapRow ctx={ctx} />
				</>
			)}
			{isGrid && (
				<>
					<StyleRow ctx={ctx} group='grid-cols' label='Columns'>
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
					<GapRow ctx={ctx} />
				</>
			)}
		</Section>
	)
}

function Spacing({ ctx }: { ctx: StyleContext }) {
	return (
		<Section title='Spacing'>
			<BoxEditor ctx={ctx} kind='padding' />
			<BoxEditor ctx={ctx} kind='margin' />
		</Section>
	)
}

function Size({ ctx }: { ctx: StyleContext }) {
	const row = (
		group: UtilityGroup,
		label: string,
		prefix: string,
		options: readonly string[]
	) => (
		<StyleRow ctx={ctx} group={group} label={label}>
			{(state) => (
				<ValueInput state={state} prefix={prefix} options={options} />
			)}
		</StyleRow>
	)
	return (
		<Section title='Size'>
			{row('width', 'Width', 'w', WIDTHS)}
			{row('max-width', 'Max width', 'max-w', MAX_WIDTHS)}
			{row('height', 'Height', 'h', HEIGHTS)}
			{row('min-height', 'Min height', 'min-h', MIN_HEIGHTS)}
		</Section>
	)
}

function Typography({ ctx }: { ctx: StyleContext }) {
	return (
		<Section title='Typography'>
			<StyleRow ctx={ctx} group='font-size' label='Size'>
				{(state) => (
					<Choose
						state={state}
						options={choices('text', FONT_SIZES)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='font-weight' label='Weight'>
				{(state) => (
					<Choose state={state} options={choices('font', WEIGHTS)} />
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='text-align' label='Align'>
				{(state) => <Segmented state={state} options={ALIGNS} />}
			</StyleRow>
			<StyleRow ctx={ctx} group='line-height' label='Line height'>
				{(state) => (
					<Choose
						state={state}
						options={choices('leading', LEADINGS)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='text-color' label='Color' stacked>
				{(state) => <ColorSwatches state={state} prefix='text' />}
			</StyleRow>
		</Section>
	)
}

function Background({ ctx }: { ctx: StyleContext }) {
	return (
		<Section title='Background'>
			<StyleRow ctx={ctx} group='background-color' label='Color' stacked>
				{(state) => <ColorSwatches state={state} prefix='bg' />}
			</StyleRow>
		</Section>
	)
}

function Effects({ ctx }: { ctx: StyleContext }) {
	return (
		<Section title='Border and effects'>
			<StyleRow ctx={ctx} group='radius' label='Radius'>
				{(state) => (
					<Choose state={state} options={choices('rounded', RADII)} />
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='shadow' label='Shadow'>
				{(state) => (
					<Choose
						state={state}
						options={choices('shadow', SHADOWS)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='opacity' label='Opacity'>
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

// Style controls write classes at the breakpoint of the canvas width
export function StylePanel({ node }: { node: ElementNode }) {
	const width = useProject((s) => s.canvasWidth)
	const bp = breakpointFor(width)
	const label = BREAKPOINTS.find((b) => b.prefix === bp)?.label ?? bp
	const ctx: StyleContext = { id: node.id, classes: node.classes, bp }
	return (
		<div className='flex flex-col'>
			<div className='flex flex-col gap-0.5 px-3 py-2'>
				<div className='flex items-center justify-between'>
					<span className='text-xs font-medium'>Style</span>
					<span className='text-primary-foreground rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-medium'>
						{label}
					</span>
				</div>
				<p className='text-muted-foreground text-xs'>
					Changes apply from {label} and wider
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
