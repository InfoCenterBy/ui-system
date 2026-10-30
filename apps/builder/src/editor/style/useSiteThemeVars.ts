import { useMemo } from 'react'
import { useDocument } from '@/store/document'
import { themeFromSite } from '@/store/themeActions'

// All theme vars with the preset values, not only the site overrides
export function useSiteThemeVars(): Record<string, string> {
	const theme = useDocument((s) => s.doc?.site.theme)
	return useMemo(() => (theme ? themeFromSite(theme).vars : {}), [theme])
}
