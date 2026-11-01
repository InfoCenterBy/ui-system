import { useMemo, type ReactNode } from 'react'
import { PRESET_NAMES } from '@ui-system/theme'
import { Button } from '@/components/ui/button'
import { ColorRow } from '@/editor/theme/ColorRow'
import { ContrastList } from '@/editor/theme/ContrastList'
import { ImportBox } from '@/editor/theme/ImportBox'
import { ShapeControls } from '@/editor/theme/ShapeControls'
import { ThemePreview } from '@/editor/theme/ThemePreview'
import { useDocument } from '@/store/document'
import { resetTheme, setPreset, themeFromSite } from '@/store/themeActions'
import { useTranslation } from 'react-i18next'

const COLORS = [
	['base-100', 'Base 100'],
	['base-200', 'Base 200'],
	['base-300', 'Base 300'],
	['primary', 'Primary'],
	['secondary', 'Secondary'],
	['accent', 'Accent'],
	['neutral', 'Neutral'],
	['info', 'Info'],
	['success', 'Success'],
	['warning', 'Warning'],
	['error', 'Error'],
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className='flex flex-col gap-3'>
			<h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
				{title}
			</h3>
			{children}
		</section>
	)
}

export function ThemeSettings() {
	const { t } = useTranslation()
	const siteTheme = useDocument((s) => s.doc?.site.theme)
	const theme = useMemo(
		() => (siteTheme ? themeFromSite(siteTheme) : null),
		[siteTheme]
	)
	if (!siteTheme || !theme) return null

	return (
		<div className='flex flex-col gap-6 p-1 pe-3'>
			<Section title={t('theme.preset')}>
				<div className='flex flex-wrap items-center gap-2'>
					<select
						aria-label={t('theme.presetAria')}
						value={siteTheme.name}
						onChange={(e) => setPreset(e.target.value)}
						className='border-input bg-background h-8 rounded-md border px-2 text-sm'
					>
						{PRESET_NAMES.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
					<Button variant='outline' size='sm' onClick={resetTheme}>
						{t('common.reset')}
					</Button>
					<ImportBox />
				</div>
			</Section>
			<Section title={t('theme.preview')}>
				<ThemePreview theme={siteTheme} />
			</Section>
			<Section title={t('theme.colors')}>
				{COLORS.map(([key, label]) => (
					<ColorRow key={key} theme={theme} bg={key} label={label} />
				))}
			</Section>
			<Section title={t('theme.shape')}>
				<ShapeControls theme={theme} />
			</Section>
			<Section title={t('theme.contrast')}>
				<ContrastList theme={theme} />
			</Section>
		</div>
	)
}
