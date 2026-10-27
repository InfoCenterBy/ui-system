import classNames from 'classnames'
import { contrastRatio } from '../../../lib/color'
import { CONTENT_OF, getColor, setAuto } from '../../../lib/theme'

const MIN_CONTRAST = 4.5

const label = (key) => key.replace('-content', '').replace('-', ' ')

// WCAG ratio for every text and background pair of the theme
const ContrastSummary = ({ theme, onChange }) => {
	const rows = Object.entries(CONTENT_OF).map(([content, bg]) => ({
		content,
		bg,
		ratio: contrastRatio(getColor(theme, bg), getColor(theme, content)),
	}))
	const low = rows.filter((row) => row.ratio < MIN_CONTRAST)

	const fixAll = () =>
		onChange(low.reduce((t, row) => setAuto(t, row.content, true), theme))

	return (
		<div className='flex flex-col gap-1'>
			{rows.map(({ content, bg, ratio }) => (
				<div key={content} className='flex items-center gap-2 text-sm'>
					<span
						className='grid h-6 w-9 shrink-0 place-items-center rounded-field text-xs font-semibold'
						style={{
							background: getColor(theme, bg),
							color: getColor(theme, content),
						}}
					>
						Aa
					</span>
					<span className='capitalize'>{label(content)}</span>
					<span
						className={classNames('ms-auto font-mono text-xs', {
							'text-warning': ratio < MIN_CONTRAST,
						})}
					>
						{ratio.toFixed(2)}
					</span>
					<span
						className={classNames(
							'badge w-10 badge-soft badge-xs',
							{
								'badge-success': ratio >= MIN_CONTRAST,
								'badge-warning': ratio < MIN_CONTRAST,
							}
						)}
					>
						{ratio >= 7
							? 'AAA'
							: ratio >= MIN_CONTRAST
								? 'AA'
								: 'low'}
					</span>
				</div>
			))}
			{low.length > 0 && (
				<button
					className='btn mt-2 btn-sm btn-warning'
					onClick={fixAll}
				>
					Fix {low.length} low contrast{' '}
					{low.length === 1 ? 'pair' : 'pairs'}
				</button>
			)}
		</div>
	)
}

export default ContrastSummary
