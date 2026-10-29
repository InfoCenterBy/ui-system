import { useEffect, useMemo } from 'react'
import { collectClasses, type ElementNode, type Site } from '@ui-system/core'
import { api } from '@/api'
import { useDocument } from '@/store/document'

const DELAY = 120

// Fetches CSS for the classes on the canvas whenever that set, the theme or the fonts change
export function useCanvasCss(
	doc: Document | null,
	roots: ElementNode[],
	theme: Site['theme'] | undefined
) {
	const classKey = useMemo(
		() => [...collectClasses(roots)].sort().join(' '),
		[roots]
	)
	const themeKey = useMemo(() => JSON.stringify(theme ?? null), [theme])
	const fontsKey = JSON.stringify(
		useDocument((s) => s.doc?.site.fonts) ?? null
	)

	// A new theme object with equal values does not refetch
	useEffect(() => {
		if (!doc || themeKey === 'null') return
		let cancelled = false
		const timer = setTimeout(() => {
			api.css(
				classKey ? classKey.split(' ') : [],
				JSON.parse(themeKey),
				JSON.parse(fontsKey) ?? undefined
			)
				.then(({ css }) => {
					const style = doc.getElementById('site-css')
					if (!cancelled && style) style.textContent = css
				})
				.catch((error: Error) => console.error(error))
		}, DELAY)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [doc, classKey, themeKey, fontsKey])
}
