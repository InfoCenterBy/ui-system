import type { Theme } from '@ui-system/theme'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { tOr, type Key } from '@/i18n'
import { setThemeVar } from '@/store/themeActions'

type Option = readonly [value: string, label: string]

const RADIUS: Option[] = [
	['0rem', '0'],
	['0.25rem', '0.25rem'],
	['0.5rem', '0.5rem'],
	['1rem', '1rem'],
	['2rem', '2rem'],
]
const SIZES: Option[] = [
	['0.1875rem', 'XS'],
	['0.21875rem', 'S'],
	['0.25rem', 'M'],
	['0.28125rem', 'L'],
	['0.3125rem', 'XL'],
]
const BORDERS: Option[] = [
	['0.5px', '0.5px'],
	['1px', '1px'],
	['1.5px', '1.5px'],
	['2px', '2px'],
]
const TOGGLE: Option[] = [
	['0', 'common.off'],
	['1', 'common.on'],
]

const GROUPS: { key: string; label: Key; options: Option[] }[] = [
	{
		key: '--radius-selector',
		label: 'shape.radiusSelector',
		options: RADIUS,
	},
	{ key: '--radius-field', label: 'shape.radiusField', options: RADIUS },
	{ key: '--radius-box', label: 'shape.radiusBox', options: RADIUS },
	{ key: '--size-selector', label: 'shape.sizeSelector', options: SIZES },
	{ key: '--size-field', label: 'shape.sizeField', options: SIZES },
	{ key: '--border', label: 'shape.border', options: BORDERS },
	{ key: '--depth', label: 'shape.depth', options: TOGGLE },
	{ key: '--noise', label: 'shape.noise', options: TOGGLE },
]

export function ShapeControls({ theme }: { theme: Theme }) {
	const { t } = useTranslation()
	return (
		<div className='grid gap-3 sm:grid-cols-2'>
			{GROUPS.map(({ key, label, options }) => (
				<div key={key}>
					<div className='mb-1 text-sm'>{t(label)}</div>
					<div className='flex flex-wrap gap-1'>
						{options.map(([value, text]) => {
							const active = (theme.vars[key] ?? '0') === value
							return (
								<Button
									key={value}
									size='xs'
									variant={active ? 'default' : 'outline'}
									aria-pressed={active}
									onClick={() => setThemeVar(key, value)}
								>
									{tOr(text, text)}
								</Button>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}
