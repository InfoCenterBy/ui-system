import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const THEME_KEY = 'theme'
const CUSTOM_KEY = 'custom-theme'
const STYLE_ID = 'custom-theme-style'
const THEMES = ['light', 'dark', 'system', 'custom']

function getSystemTheme() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light'
}

const readCustomTheme = () => {
	try {
		return JSON.parse(localStorage.getItem(CUSTOM_KEY))
	} catch {
		return null
	}
}

// Custom theme lives in a style tag under data-theme="custom"
const writeCustomStyle = (vars) => {
	let style = document.getElementById(STYLE_ID)
	if (!style) {
		style = document.createElement('style')
		style.id = STYLE_ID
		document.head.appendChild(style)
	}
	const body = Object.entries(vars)
		.map(([key, value]) => `${key}: ${value};`)
		.join(' ')
	style.textContent = `[data-theme='custom'] { ${body} --noise: 0; }`
}

export const ThemeProvider = ({ children }) => {
	const [customTheme, setCustomTheme] = useState(readCustomTheme)

	// Initial theme: localStorage, then system
	const getInitialTheme = () => {
		const saved = localStorage.getItem(THEME_KEY)
		if (saved === 'custom' && !customTheme) return 'system'
		if (THEMES.includes(saved)) return saved
		return 'system'
	}
	const [theme, setTheme] = useState(getInitialTheme)

	useEffect(() => {
		if (customTheme) writeCustomStyle(customTheme)
	}, [customTheme])

	// Apply the theme to <html> via data-theme
	useEffect(() => {
		const applyTheme = (t) => {
			let applied = t
			if (t === 'system') applied = getSystemTheme()
			document.documentElement.setAttribute('data-theme', applied)
		}
		applyTheme(theme)
		localStorage.setItem(THEME_KEY, theme)
		// Follow OS theme changes when system is selected
		let mql
		const handleSystemChange = () => {
			if (theme === 'system') applyTheme('system')
		}
		if (theme === 'system') {
			mql = window.matchMedia('(prefers-color-scheme: dark)')
			mql.addEventListener('change', handleSystemChange)
		}
		return () => {
			if (mql) mql.removeEventListener('change', handleSystemChange)
		}
	}, [theme])

	// Switch theme
	const toggleTheme = (newTheme) => {
		if (newTheme === 'custom' && !customTheme) return
		if (THEMES.includes(newTheme)) setTheme(newTheme)
	}

	// Saves a generated theme and switches the site to it
	const applyCustomTheme = (vars) => {
		localStorage.setItem(CUSTOM_KEY, JSON.stringify(vars))
		setCustomTheme(vars)
		setTheme('custom')
	}

	return (
		<ThemeContext.Provider
			value={{ theme, toggleTheme, customTheme, applyCustomTheme }}
		>
			{children}
		</ThemeContext.Provider>
	)
}

export const useTheme = () => useContext(ThemeContext)
