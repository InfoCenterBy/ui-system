import {
	CONTENT_OF,
	contrastRatio,
	getColor,
	type ContentKey,
	type Theme,
} from '@ui-system/theme'
import { Button } from '@/components/ui/button'
import { setAutoFor } from '@/store/themeActions'

const MIN = 4.5

const grade = (ratio: number) =>
	ratio >= 7 ? 'AAA' : ratio >= MIN ? 'AA' : 'low'

// WCAG ratio for every text and background pair
export function ContrastList({ theme }: { theme: Theme }) {
	const rows = (Object.entries(CONTENT_OF) as [ContentKey, string][]).map(
		([content, bg]) => ({
			content,
			bg,
			ratio: contrastRatio(getColor(theme, bg), getColor(theme, content)),
		})
	)
	const low = rows.filter((row) => row.ratio < MIN)
	return (
		<div className='flex flex-col gap-1'>
			{rows.map(({ content, bg, ratio }) => (
				<div key={content} className='flex items-center gap-2 text-sm'>
					<span
						className='grid h-6 w-9 place-items-center rounded text-xs font-semibold'
						style={{
							background: getColor(theme, bg),
							color: getColor(theme, content),
						}}
					>
						Aa
					</span>
					<span className='capitalize'>
						{content.replace('-content', '')}
					</span>
					<span className='ms-auto font-mono text-xs'>
						{ratio.toFixed(2)}
					</span>
					<span
						className={`w-10 rounded px-1 text-center text-xs ${ratio < MIN ? 'bg-destructive/15 text-destructive' : 'bg-muted'}`}
					>
						{grade(ratio)}
					</span>
				</div>
			))}
			{low.length > 0 && (
				<Button
					variant='outline'
					size='sm'
					className='mt-1 self-start'
					onClick={() => setAutoFor(low.map((row) => row.content))}
				>
					Fix low contrast ({low.length})
				</Button>
			)}
		</div>
	)
}
