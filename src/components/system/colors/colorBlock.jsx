import classNames from 'classnames/bind'
import { toast } from 'react-toastify'
import SystemToast from '../systemToast'

const ColorBlock = ({ colorFromParent, className, textColor, colorType }) => {
	const colorClass = classNames('rounded w-[32px] h-[32px]', colorFromParent)
	const copyColor = (colorClass, colorType) => {
		let colorToCopy = colorFromParent
		if (colorType === 'color') {
			// Resolve the real color value through a temporary element
			const tempDiv = document.createElement('div')
			tempDiv.className = colorClass + ' w-0 h-0 hidden'
			document.body.appendChild(tempDiv)
			colorToCopy = getComputedStyle(tempDiv).backgroundColor
			document.body.removeChild(tempDiv)
		}
		navigator.clipboard.writeText(colorToCopy)
		toast(
			<SystemToast type='success'>
				Color {colorFromParent} copied to clipboard
			</SystemToast>,
			{
				closeButton: false,
				autoClose: 1000,
				closeOnClick: true,
			}
		)
	}
	return (
		<div
			className={classNames(
				'grid cursor-pointer items-center rounded-lg border border-base-content p-1',
				className
			)}
			onClick={() => copyColor(colorFromParent, colorType)}
		>
			<div className='tooltip'>
				<div
					className={classNames(
						'tooltip-content',
						`${colorFromParent}`,
						`after:${colorFromParent}`
					)}
				>
					<div
						className={classNames(
							'text-sm',
							// Text color adapts to the color strength
							(() => {
								const match = /-(\d{2,3})$/.exec(
									colorFromParent || ''
								)
								if (match) {
									const strength = parseInt(match[1], 10)
									if (strength >= 700) return 'text-white'
									if (strength >= 500) return 'text-gray-100'
									if (strength >= 300) return 'text-gray-800'
									return 'text-gray-900'
								}
								return 'text-gray-900'
							})(),
							textColor
						)}
						style={{ backgroundColor: colorFromParent }}
					>
						{colorFromParent}
					</div>
				</div>
				<div className={colorClass}></div>
			</div>
		</div>
	)
}

export default ColorBlock
