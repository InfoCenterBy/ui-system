import classNames from 'classnames'
import { useTheme } from '../../contexts/themeContext'
import Icon from './icon'

const OPTIONS = [
	{ value: 'light', label: 'Light', icon: 'sun' },
	{ value: 'dark', label: 'Dark', icon: 'moon' },
	{ value: 'system', label: 'System', icon: 'system' },
]

const ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme()
	const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2]

	const select = (value) => {
		toggleTheme(value)
		// Blur closes the focus-based daisy dropdown
		document.activeElement?.blur()
	}

	return (
		<div className='dropdown dropdown-end'>
			<div
				tabIndex={0}
				role='button'
				className='btn btn-square btn-ghost'
				aria-label='Theme'
			>
				<Icon name={current.icon} />
			</div>
			<ul
				tabIndex={0}
				className='menu dropdown-content z-50 mt-2 w-36 rounded-box border border-base-200 bg-base-100 p-2 shadow-lg'
			>
				{OPTIONS.map((option) => (
					<li key={option.value}>
						<button
							className={classNames({
								'menu-active': option.value === theme,
							})}
							onClick={() => select(option.value)}
						>
							<Icon name={option.icon} className='size-4' />
							{option.label}
						</button>
					</li>
				))}
			</ul>
		</div>
	)
}

export default ThemeToggle
