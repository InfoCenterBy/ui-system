import {
	isElement,
	locate,
	resolveUtility,
	setUtility,
	type Breakpoint,
} from '@ui-system/core'
import { columnsAt, isGridParent, pinStarts } from '@/editor/canvas/gridMath'
import { useRoots } from '@/editor/canvas/useRoots'
import type { StyleContext } from '@/editor/style/controls'
import { ScreenTable } from '@/editor/style/ScreenTable'
import { SCREENS, utilityCell, type ScreenCell } from '@/editor/style/screens'
import { Section } from '@/editor/style/StylePanel'
import { t } from '@/i18n'
import { setClasses } from '@/store/actions'

const upTo = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

const spans = (cols: number) =>
	upTo(cols).map((n) => ({ value: `col-span-${n}`, label: String(n) }))

// Offset k starts the item at line k + 1, 0 puts it back in the flow
const offsets = (cols: number) => [
	{ value: 'col-start-auto', label: '0' },
	...upTo(Math.min(cols - 1, 12)).map((n) => ({
		value: `col-start-${n + 1}`,
		label: String(n),
	})),
]

// A grid item without a span takes one column
const spanCell = (classes: string, bp: Breakpoint): ScreenCell => {
	const cell = utilityCell(classes, 'col-span', bp)
	return { ...cell, shown: cell.shown ?? 'col-span-1' }
}

const offsetCell = (classes: string, bp: Breakpoint): ScreenCell => {
	const cell = utilityCell(classes, 'col-start', bp)
	return { ...cell, shown: cell.shown ?? 'col-start-auto' }
}

const numberOf = (utility: string | undefined, fallback: number) => {
	const n = Number(utility?.match(/-(\d+)$/)?.[1])
	return Number.isFinite(n) && n > 0 ? n : fallback
}

// Strip of the parent's columns: the item's offset and width at the canvas screen
function ColumnBar({
	cols,
	span,
	offset,
}: {
	cols: number
	span: number
	offset: number
}) {
	return (
		<div
			aria-hidden
			className='grid h-2.5 gap-px'
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
		>
			{upTo(cols).map((n) => (
				<span
					key={n}
					className={
						n > offset && n <= offset + span
							? 'rounded-[1px] bg-primary'
							: 'bg-muted rounded-[1px]'
					}
				/>
			))}
		</div>
	)
}

// Width and offset in the parent's columns per screen, like Bootstrap's col-md-6
export function ColumnSection({ ctx }: { ctx: StyleContext }) {
	const roots = useRoots()
	const parent = locate(roots, ctx.id)?.parent
	if (ctx.state || !parent || !isElement(parent)) return null
	if (!isGridParent(parent.classes)) return null
	const colsAt = (bp: Breakpoint) => columnsAt(parent.classes, bp)
	const active = SCREENS.includes(ctx.canvasBp) ? ctx.canvasBp : 'xl'
	const write =
		(group: 'col-span' | 'col-start') =>
		(bp: Breakpoint, value: string | null) =>
			setClasses(
				ctx.id,
				pinStarts(setUtility(ctx.classes, group, bp, value))
			)
	const span = numberOf(
		resolveUtility(ctx.classes, 'col-span', active)?.utility,
		1
	)
	const start = numberOf(
		resolveUtility(ctx.classes, 'col-start', active)?.utility,
		1
	)
	return (
		<Section id='columns' title={t('columns.title')}>
			<ScreenTable
				name={t('columns.title')}
				active={active}
				rows={[
					{
						label: t('columns.width'),
						options: (bp) => spans(colsAt(bp)),
						cell: (bp) => spanCell(ctx.classes, bp),
						onChange: write('col-span'),
					},
					{
						label: t('columns.offset'),
						options: (bp) => offsets(colsAt(bp)),
						cell: (bp) => offsetCell(ctx.classes, bp),
						onChange: write('col-start'),
					},
				]}
			/>
			<ColumnBar cols={colsAt(active)} span={span} offset={start - 1} />
			<span className='text-muted-foreground/80 text-[10px] leading-tight'>
				{t('columns.note', { count: colsAt(active) })}
			</span>
		</Section>
	)
}
