import { createStore } from './store'

const oneOf = (list) => (value) => list.includes(value)

export const CODE_FORMATS = ['html', 'jsx']
export const codeFormat = createStore(
	'code-format',
	'html',
	oneOf(CODE_FORMATS)
)

export const PREVIEW_WIDTHS = {
	desktop: '100%',
	tablet: '768px',
	phone: '375px',
}
export const previewWidth = createStore(
	'preview-width',
	'desktop',
	oneOf(Object.keys(PREVIEW_WIDTHS))
)

// Not saved: a different preview theme is a quick check, not a setting
export const previewTheme = createStore(null, 'site')

export const favorites = createStore('favorites', [], (value) =>
	Array.isArray(value)
)

export const favoriteId = (slug, variant) => `${slug}/${variant}`

export const toggleFavorite = (id) =>
	favorites.set((list) =>
		list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
	)

// Hook names keep the React rules and compiler happy
export const useCodeFormat = codeFormat.use
export const usePreviewWidth = previewWidth.use
export const usePreviewTheme = previewTheme.use
export const useFavorites = favorites.use
