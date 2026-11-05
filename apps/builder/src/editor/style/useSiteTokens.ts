import { useMemo } from 'react'
import { resolveVars } from '@ui-system/theme'
import type { DesignToken } from '@ui-system/core'
import { useDocument } from '@/store/document'
import { useSiteThemeVars } from '@/editor/style/useSiteThemeVars'

const NONE: DesignToken[] = []

export function useSiteTokens(): DesignToken[] {
	return useDocument((s) => s.doc?.site.tokens) ?? NONE
}

// Token colors as plain CSS, theme references are resolved against the theme
export function useTokenColors(): Record<string, string> {
	const tokens = useSiteTokens()
	const vars = useSiteThemeVars()
	return useMemo(
		() =>
			Object.fromEntries(
				tokens
					.filter((t) => t.type === 'color')
					.map((t) => [t.name, resolveVars(t.value, vars)])
			),
		[tokens, vars]
	)
}
