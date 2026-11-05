import {
	TOKEN_NAMESPACE,
	tokenClassNames,
	tokenOfClass,
	type DesignToken,
} from '@ui-system/core'
import type { ClassIndex } from '@ui-system/theme/classes'

// The class index plus the utilities the site tokens add
export function withTokens(
	index: ClassIndex,
	tokens: readonly DesignToken[]
): ClassIndex {
	if (tokens.length === 0) return index
	return {
		...index,
		utilities: [...index.utilities, ...tokenClassNames(tokens)],
		cssOf: (name) => {
			const known = index.cssOf(name)
			if (known) return known
			const token = tokenOfClass(name, tokens)
			return token
				? `--${TOKEN_NAMESPACE[token.type]}-${token.name}: ${token.value};`
				: null
		},
		colorOf: (name) => {
			const known = index.colorOf(name)
			if (known) return known
			const token = tokenOfClass(name, tokens)
			return token?.type === 'color' ? token.value : null
		},
	}
}
