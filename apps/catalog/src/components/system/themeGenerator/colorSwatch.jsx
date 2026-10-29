import classNames from 'classnames'
import { hexToOklch, oklchToHex } from '../../../lib/color'

// Native color picker shown as a swatch, stores the value as OKLCH
const ColorSwatch = ({ label, value, onChange, className }) => (
	<span
		className={classNames(
			'relative inline-block size-8 shrink-0 cursor-pointer overflow-hidden rounded-field border border-base-content/20 shadow-sm',
			className
		)}
		style={{ background: value }}
		title={`${label}: ${value}`}
	>
		<input
			type='color'
			aria-label={label}
			className='absolute inset-0 size-full cursor-pointer opacity-0'
			value={oklchToHex(value)}
			onChange={(e) => onChange(hexToOklch(e.target.value))}
		/>
	</span>
)

export default ColorSwatch
