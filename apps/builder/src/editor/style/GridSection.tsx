import { cn } from 'cn'
import {
	findElement,
	getUtility,
	isElement,
	setUtility,
	resolveUtility,
	type Breakpoint,
} from '@ui-system/core'
import {
	Choose,
	ValueInput,
	StyleRow,
	type Choice,
} from '@/editor/style/controls'
import type { StyleContext } from '@/editor/style/controls'
import { Section } from '@/editor/style/StylePanel'
import {
	GRID_LAYOUTS,
	PER_ROW,
	activeLayout,
	perRowAt,
	withPerRow,
	layoutClasses,
	setFrom,
	type GridLayout,
} from '@/editor/canvas/gridMath'
import { useRoots } from '@/editor/canvas/useRoots'
import { ScreenTable } from '@/editor/style/ScreenTable'
import { SCREENS, utilityCell, type ScreenRow } from '@/editor/style/screens'
import { SPACING_STEPS } from '@/editor/style/values'
import { t } from '@/i18n'
import { setClasses, setClassesMany } from '@/store/actions'

const COUNTS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const ROW_COUNTS = COUNTS.slice(0, 8)

const options = (prefix: string, values: string[]): Choice[] =>
	values.map((value) => ({ value: `${prefix}-${value}`, label: value }))

const NAMES: Record<GridLayout['id'], () => string> = {
	two: () => t('grid.two'),
	three: () => t('grid.three'),
	four: () => t('grid.four'),
	'third-two-thirds': () => t('grid.thirdTwoThirds'),
	'two-thirds-third': () => t('grid.twoThirdsThird'),
	mosaic: () => t('grid.mosaic'),
	twelve: () => t('grid.twelve'),
}

// Tiny picture of a layout on its button
function Thumb({ layout }: { layout: GridLayout }) {
	const template = layout.cols.match(/\[(.+)\]/)?.[1].replace(/_/g, ' ')
	const count = Number(layout.cols.match(/-(\d+)$/)?.[1] ?? 0)
	const mosaic = layout.id === 'mosaic'
	const cells = mosaic ? 3 : template ? 2 : count
	return (
		<span
			aria-hidden
			className='grid h-4 w-7 gap-px'
			style={{
				gridTemplateColumns: template ?? `repeat(${count}, 1fr)`,
				gridTemplateRows: mosaic ? 'repeat(2, 1fr)' : undefined,
			}}
		>
			{Array.from({ length: cells }, (_, i) => (
				<span
					key={i}
					className={cn(
						'bg-current opacity-70',
						mosaic && i === 0 && 'col-span-2 row-span-2'
					)}
				/>
			))}
		</span>
	)
}

// Grid container controls at the style panel breakpoint, written as plain Tailwind utilities
export function GridSection({ ctx }: { ctx: StyleContext }) {
	const roots = useRoots()
	const display = resolveUtility(ctx.classes, 'display', ctx.bp)?.utility
	if (display !== 'grid' && display !== 'inline-grid') return null
	const items = findElement(roots, ctx.id)?.children.filter(isElement) ?? []
	const current = activeLayout(ctx.classes, items[0]?.classes, ctx.bp)

	// One undo step for the container and every item it touches
	const applyLayout = (layout: GridLayout) => {
		const next = layoutClasses(
			layout,
			ctx.classes,
			items.map((item) => item.classes),
			ctx.bp
		)
		setClassesMany([
			{ id: ctx.id, classes: next.container },
			...items
				.map((item, i) => ({ id: item.id, classes: next.children[i] }))
				.filter((change, i) => change.classes !== items[i].classes),
		])
	}
	// Items per row, written to every item at one screen
	const perRowCell = (bp: Breakpoint) => {
		const own = items.every((item) =>
			getUtility(item.classes, 'col-span', bp)
		)
		const shown = perRowAt(
			ctx.classes,
			items.map((item) => item.classes),
			bp
		)
		const value = shown === null ? null : String(shown)
		return { own: own ? value : null, shown: value }
	}
	const setPerRow = (bp: Breakpoint, value: string | null) => {
		const next = withPerRow(
			ctx.classes,
			items.map((item) => item.classes),
			bp,
			value ? Number(value) : null
		)
		setClassesMany([
			{ id: ctx.id, classes: next.container },
			...items
				.map((item, i) => ({ id: item.id, classes: next.children[i] }))
				.filter((change, i) => change.classes !== items[i].classes),
		])
	}
	const screens: ScreenRow[] = [
		{
			label: t('grid.columns'),
			options: COUNTS.map((n) => ({
				value: `grid-cols-${n}`,
				label: n,
			})),
			cell: (bp) => utilityCell(ctx.classes, 'grid-cols', bp),
			onChange: (bp, value) =>
				setClasses(
					ctx.id,
					setUtility(ctx.classes, 'grid-cols', bp, value)
				),
		},
	]
	if (items.length > 0) {
		screens.push({
			label: t('grid.perRow'),
			options: PER_ROW.map((n) => ({
				value: String(n),
				label: String(n),
			})),
			cell: perRowCell,
			onChange: setPerRow,
		})
	}
	// Rows apply from the chosen screen up, so the canvas shows what was picked
	const rowsFromHere = (utility: string | null, at: Breakpoint) =>
		setFrom(ctx.classes, 'grid-rows', at, utility)

	return (
		<Section id='grid' title={t('grid.title')}>
			<div className='flex flex-col gap-1'>
				<span className='text-muted-foreground text-xs'>
					{t('grid.layouts')}
				</span>
				<div className='grid grid-cols-3 gap-1'>
					{GRID_LAYOUTS.map((layout) => (
						<button
							key={layout.id}
							type='button'
							title={NAMES[layout.id]()}
							aria-label={NAMES[layout.id]()}
							aria-pressed={current === layout.id}
							className={cn(
								'border-input flex h-8 items-center justify-center rounded-lg border',
								current === layout.id
									? 'text-primary-foreground bg-primary'
									: 'hover:bg-muted'
							)}
							onClick={() => applyLayout(layout)}
						>
							<Thumb layout={layout} />
						</button>
					))}
				</div>
				<span className='text-muted-foreground/80 text-[10px] leading-tight'>
					{t('grid.layoutsNote')}
				</span>
			</div>
			<div className='flex flex-col gap-1'>
				<span className='text-muted-foreground text-xs'>
					{t('grid.byScreen')}
				</span>
				<ScreenTable
					name={t('grid.byScreen')}
					active={
						SCREENS.includes(ctx.canvasBp) ? ctx.canvasBp : 'xl'
					}
					rows={screens}
				/>
				<span className='text-muted-foreground/80 text-[10px] leading-tight'>
					{t('grid.perRowNote')}
				</span>
			</div>
			<StyleRow
				ctx={ctx}
				group='grid-rows'
				label={t('grid.rows')}
				apply={rowsFromHere}
				note={t('grid.rowsNote')}
			>
				{(state) => (
					<Choose
						state={state}
						options={options('grid-rows', ROW_COUNTS)}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='gap-x' label={t('grid.gapX')}>
				{(state) => (
					<ValueInput
						state={state}
						prefix='gap-x'
						options={SPACING_STEPS}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='gap-y' label={t('grid.gapY')}>
				{(state) => (
					<ValueInput
						state={state}
						prefix='gap-y'
						options={SPACING_STEPS}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='justify-items' label={t('grid.itemsX')}>
				{(state) => (
					<Choose
						state={state}
						options={options('justify-items', [
							'start',
							'center',
							'end',
							'stretch',
						])}
					/>
				)}
			</StyleRow>
			<StyleRow ctx={ctx} group='align-items' label={t('grid.itemsY')}>
				{(state) => (
					<Choose
						state={state}
						options={options('items', [
							'start',
							'center',
							'end',
							'stretch',
						])}
					/>
				)}
			</StyleRow>
		</Section>
	)
}
