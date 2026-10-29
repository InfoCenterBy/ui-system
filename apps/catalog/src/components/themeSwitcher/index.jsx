import { useTheme } from '../../contexts/themeContext'

const ThemeSwitcher = () => {
	const { toggleTheme, theme } = useTheme()
	const buttonClasses = `text-color-${theme} border-color-${theme}`
	return (
		<>
			<button
				className={[buttonClasses, 'border-2']}
				onClick={() => {
					toggleTheme('theme1')
					console.log(toggleTheme('theme1'))
				}}
			>
				theme1
			</button>
		</>
	)
}

export default ThemeSwitcher
