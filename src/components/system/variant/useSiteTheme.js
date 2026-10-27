import { useSyncExternalStore } from 'react'

const CUSTOM_STYLE_ID = 'custom-theme-style'

const read = () => {
	const theme = document.documentElement.getAttribute('data-theme') ?? 'light'
	const customCss =
		document.getElementById(CUSTOM_STYLE_ID)?.textContent ?? ''
	return `${theme}\n${customCss}`
}

let snapshot = read()

// Read on every render, the theme can change before anyone subscribes
const getSnapshot = () => {
	const next = read()
	if (next !== snapshot) snapshot = next
	return snapshot
}

// Watches data-theme and the custom theme style tag
const subscribe = (listener) => {
	const observer = new MutationObserver(listener)
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	})
	observer.observe(document.head, {
		childList: true,
		subtree: true,
		characterData: true,
	})
	return () => observer.disconnect()
}

// Current site theme name and the CSS of a custom theme if one is applied
export const useSiteTheme = () => {
	const value = useSyncExternalStore(subscribe, getSnapshot)
	const [theme, ...css] = value.split('\n')
	return { theme, customCss: css.join('\n') }
}
