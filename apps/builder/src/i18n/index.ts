import i18n, { type ParseKeys } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import ru from './locales/ru'

export type Locale = 'en' | 'ru'
export type Key = ParseKeys

export const STORAGE_KEY = 'builder.lang'
export const LOCALES: Locale[] = ['en', 'ru']

// Tests assert English texts, so they never depend on the machine language
const isTest = import.meta.env.MODE === 'test'

const applyLang = (lng: string) => {
	if (typeof document !== 'undefined') document.documentElement.lang = lng
}

void i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: { en: { translation: en }, ru: { translation: ru } },
		lng: isTest ? 'en' : undefined,
		fallbackLng: 'en',
		supportedLngs: LOCALES,
		// ru-RU and the like count as ru
		nonExplicitSupportedLngs: true,
		interpolation: { escapeValue: false },
		detection: {
			order: ['localStorage', 'navigator'],
			lookupLocalStorage: STORAGE_KEY,
			// Only an explicit choice is remembered, see setLocale
			caches: [],
		},
		react: { useSuspense: false },
	})

applyLang(i18n.resolvedLanguage ?? 'en')
i18n.on('languageChanged', () => applyLang(i18n.resolvedLanguage ?? 'en'))

export const currentLocale = (): Locale =>
	i18n.resolvedLanguage === 'ru' ? 'ru' : 'en'

export const setLocale = (locale: Locale) => {
	try {
		localStorage.setItem(STORAGE_KEY, locale)
	} catch {
		// Storage can be blocked, the choice then lasts for the session
	}
	void i18n.changeLanguage(locale)
}

// For code outside React: toasts, store actions, confirm() and prompt()
export const t = i18n.t.bind(i18n)

// Names that come from data packages: translated when a key exists, else as is
export function tOr(key: string, fallback: string): string {
	return i18n.exists(key) ? i18n.t(key as Key) : fallback
}

export default i18n
