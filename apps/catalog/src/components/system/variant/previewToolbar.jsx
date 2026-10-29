import classNames from 'classnames'
import Icon from '../icon'
import {
	previewTheme,
	previewWidth,
	usePreviewTheme,
	usePreviewWidth,
} from '../../../lib/preferences'
import { PRESET_NAMES } from '@ui-system/theme'

const WIDTHS = [
	['phone', 'phone', 'Phone, 375px'],
	['tablet', 'tablet', 'Tablet, 768px'],
	['desktop', 'system', 'Full width'],
]

// Preview width and theme for every example on the page
const PreviewToolbar = ({ className }) => {
	const width = usePreviewWidth()
	const theme = usePreviewTheme()

	return (
		<div className={classNames('flex items-center gap-2', className)}>
			<div className='join' role='group' aria-label='Preview width'>
				{WIDTHS.map(([value, icon, label]) => (
					<button
						key={value}
						className={classNames(
							'btn join-item btn-square btn-sm',
							{
								'btn-active': width === value,
							}
						)}
						aria-label={label}
						aria-pressed={width === value}
						title={label}
						onClick={() => previewWidth.set(value)}
					>
						<Icon name={icon} className='size-4' />
					</button>
				))}
			</div>
			<select
				className='select w-36 select-sm'
				aria-label='Preview theme'
				value={theme}
				onChange={(e) => previewTheme.set(e.target.value)}
			>
				<option value='site'>Site theme</option>
				{PRESET_NAMES.map((name) => (
					<option key={name} value={name}>
						{name}
					</option>
				))}
			</select>
		</div>
	)
}

export default PreviewToolbar
