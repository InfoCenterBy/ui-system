import { cn } from 'cn'
import type { Breakpoint } from '@ui-system/core'
import { SCREENS, screenName, type ScreenRow } from '@/editor/style/screens'
import { t } from '@/i18n'

const INHERIT = '__inherit'

// One select per screen, an empty one shows what it inherits; the canvas screen is highlighted
export function ScreenTable({
	name,
	rows,
	active,
}: {
	// Read out with every select
	name: string
	rows: ScreenRow[]
	active: Breakpoint
}) {
	const labelled = rows.some((row) => row.label)
	return (
		<div
			className={cn(
				'grid items-center gap-x-1 gap-y-1',
				labelled
					? 'grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]'
					: 'grid-cols-[repeat(5,minmax(0,1fr))]'
			)}
		>
			{labelled && <span />}
			{SCREENS.map((bp) => (
				<span
					key={bp}
					title={bp === '' ? t('style.allScreens') : undefined}
					className={cn(
						'rounded text-center text-[10px] font-medium',
						bp === active
							? 'bg-primary/15 text-primary'
							: 'text-muted-foreground'
					)}
				>
					{screenName(bp)}
				</span>
			))}
			{rows.map((row, i) => (
				<ScreenRowCells key={row.label ?? i} name={name} row={row} />
			))}
		</div>
	)
}

function ScreenRowCells({ name, row }: { name: string; row: ScreenRow }) {
	const optionsAt = (bp: Breakpoint) =>
		typeof row.options === 'function' ? row.options(bp) : row.options
	return (
		<>
			{row.label && (
				<span className='text-muted-foreground truncate text-xs'>
					{row.label}
				</span>
			)}
			{SCREENS.map((bp) => {
				const { own, shown } = row.cell(bp)
				const options = optionsAt(bp)
				const labelOf = (value: string | null) =>
					options.find((o) => o.value === value)?.label ??
					value ??
					'—'
				// A value outside the choices, e.g. a span wider than the columns, stays visible
				const extra =
					own && !options.some((o) => o.value === own) ? own : null
				return (
					<select
						key={bp}
						aria-label={[name, row.label, screenName(bp)]
							.filter(Boolean)
							.join(', ')}
						value={own ?? INHERIT}
						className={cn(
							'border-input bg-background h-7 w-full min-w-0 appearance-none rounded-md border px-1 text-center text-[11px]',
							own === null &&
								'text-muted-foreground/70 border-dashed'
						)}
						onChange={(e) =>
							row.onChange(
								bp,
								e.target.value === INHERIT
									? null
									: e.target.value
							)
						}
					>
						<option value={INHERIT}>
							{own === null ? labelOf(shown) : t('style.inherit')}
						</option>
						{options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
						{extra && <option value={extra}>{extra}</option>}
					</select>
				)
			})}
		</>
	)
}
