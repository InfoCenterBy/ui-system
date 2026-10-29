import { useEffect, useState } from 'react'
import { collectClasses, parseSection, type Site } from '@ui-system/core'
import { sectionPresets } from '@ui-system/blocks/sections'
import { api } from '@/api'
import { useDocument } from '@/store/document'

const cache = new Map<string, Promise<string>>()

const allClasses = () => {
	const set = new Set<string>()
	for (const preset of sectionPresets) {
		for (const c of collectClasses([parseSection(preset)])) set.add(c)
	}
	return [...set].sort()
}

// One request per theme, shared by every thumbnail
const cssFor = (theme: Site['theme']) => {
	const key = JSON.stringify(theme)
	let css = cache.get(key)
	if (!css) {
		css = api.css(allClasses(), theme).then((r) => r.css)
		css.catch(() => cache.delete(key))
		cache.set(key, css)
	}
	return css
}

// CSS for all presets with the current site theme, null while loading
export function usePresetCss() {
	const theme = useDocument((s) => s.doc?.site.theme)
	const themeKey = theme ? JSON.stringify(theme) : null
	const [state, setState] = useState<{ key: string; css: string } | null>(
		null
	)
	useEffect(() => {
		if (!themeKey) return
		let cancelled = false
		cssFor(JSON.parse(themeKey) as Site['theme'])
			.then((css) => {
				if (!cancelled) setState({ key: themeKey, css })
			})
			.catch((error: Error) => console.error(error))
		return () => {
			cancelled = true
		}
	}, [themeKey])
	return state && state.key === themeKey ? state.css : null
}
