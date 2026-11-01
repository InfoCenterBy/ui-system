import { useTranslation } from 'react-i18next'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { LOCALES, setLocale, type Locale } from '@/i18n'

// Compact EN / RU switch, the whole UI re-renders on change
export function LangSwitch({ className = '' }: { className?: string }) {
	const { t, i18n } = useTranslation()
	const locale: Locale = i18n.resolvedLanguage === 'ru' ? 'ru' : 'en'
	return (
		<div
			role='group'
			aria-label={t('lang.label')}
			className={`border-input flex shrink-0 overflow-hidden rounded-lg border ${className}`}
		>
			{LOCALES.map((id) => (
				<button
					key={id}
					type='button'
					lang={id}
					aria-pressed={locale === id}
					className={`h-6 px-1.5 text-xs font-medium not-first:border-l ${
						locale === id
							? 'text-secondary-foreground bg-secondary'
							: 'text-muted-foreground hover:bg-muted'
					}`}
					onClick={() => {
						// The canvas frame is rebuilt, drop the reference to the old one first
						useCanvas.getState().setDoc(null)
						setLocale(id)
					}}
				>
					{id.toUpperCase()}
				</button>
			))}
		</div>
	)
}
