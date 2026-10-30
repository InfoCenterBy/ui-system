import { useEffect, useState } from 'react'
import { collectClasses, parseHtml, type Site } from '@ui-system/core'
import { elementCategories } from '@ui-system/blocks'
import { api } from '@/api'
import { LAYOUT_COMPONENTS } from '@/editor/layoutPresets'
import { useDocument } from '@/store/document'

const cache = new Map<string, Promise<string>>()

const allClasses = () => {
	const set = new Set<string>()
	const htmls = [
		...LAYOUT_COMPONENTS.flatMap((c) => c.variants.map((v) => v.html)),
		...elementCategories.flatMap((c) => c.variants.map((v) => v.html)),
	]
	for (const html of htmls) {
		for (const c of collectClasses(parseHtml(html))) set.add(c)
	}
	return [...set].sort()
}

// One request per theme, shared by every element preview
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

// CSS for all library elements with the current site theme, null while loading
export function useElementCss() {
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
