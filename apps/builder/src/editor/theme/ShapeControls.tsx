import type { Theme } from '@ui-system/theme'
import { Button } from '@/components/ui/button'
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
	['0', 'Off'],
	['1', 'On'],
]

const GROUPS: { key: string; label: string; options: Option[] }[] = [
	{ key: '--radius-selector', label: 'Radius: selectors', options: RADIUS },
	{ key: '--radius-field', label: 'Radius: fields', options: RADIUS },
	{ key: '--radius-box', label: 'Radius: boxes', options: RADIUS },
	{ key: '--size-selector', label: 'Size: selectors', options: SIZES },
	{ key: '--size-field', label: 'Size: fields', options: SIZES },
	{ key: '--border', label: 'Border', options: BORDERS },
	{ key: '--depth', label: 'Depth', options: TOGGLE },
	{ key: '--noise', label: 'Noise', options: TOGGLE },
]

export function ShapeControls({ theme }: { theme: Theme }) {
	return (
		<div className='grid gap-3 sm:grid-cols-2'>
			{GROUPS.map(({ key, label, options }) => (
				<div key={key}>
					<div className='mb-1 text-sm'>{label}</div>
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
									{text}
								</Button>
							)
						})}
					</div>
				</div>
			))}
		</div>
	)
}
