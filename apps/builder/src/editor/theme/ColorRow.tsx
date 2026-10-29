import { useRef } from 'react'
import {
	CONTENT_OF,
	getColor,
	hexToOklch,
	oklchToHex,
	parseOklch,
	type ContentKey,
	type Theme,
} from '@ui-system/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setThemeAuto, setThemeColor } from '@/store/themeActions'

interface ColorInputProps {
	label: string
	value: string
	onChange: (value: string) => void
}

// Swatch opens the native picker, the text field takes any OKLCH value
function ColorInput({ label, value, onChange }: ColorInputProps) {
	const picker = useRef<HTMLInputElement>(null)
	const commit = (text: string) => {
		const clean = text.trim()
		if (clean !== value && parseOklch(clean)) onChange(clean)
	}
	return (
		<div className='relative flex items-center gap-2'>
			<button
				type='button'
				aria-label={`Pick ${label}`}
				className='border-border size-7 shrink-0 rounded-md border'
				style={{ background: value }}
				onClick={() => picker.current?.click()}
			/>
			<input
				ref={picker}
				type='color'
				tabIndex={-1}
				aria-hidden
				className='pointer-events-none absolute size-0 opacity-0'
				value={oklchToHex(value)}
				onChange={(e) => onChange(hexToOklch(e.target.value))}
			/>
			<Input
				key={value}
				aria-label={label}
				defaultValue={value}
				className='h-7 w-48 font-mono text-xs'
				onBlur={(e) => commit(e.target.value)}
				onKeyDown={(e) =>
					e.key === 'Enter' && commit(e.currentTarget.value)
				}
			/>
		</div>
	)
}

interface ColorRowProps {
	theme: Theme
	bg: string
	label: string
}

// A background color with its content color, content can follow automatically
export function ColorRow({ theme, bg, label }: ColorRowProps) {
	const content = (Object.keys(CONTENT_OF) as ContentKey[]).find(
		(key) => CONTENT_OF[key] === bg
	)
	return (
		<div className='flex flex-wrap items-center gap-x-6 gap-y-1'>
			<span className='w-20 text-sm'>{label}</span>
			<ColorInput
				label={bg}
				value={getColor(theme, bg)}
				onChange={(value) => setThemeColor(bg, value)}
			/>
			{content && (
				<div className='flex items-center gap-2'>
					<ColorInput
						label={content}
						value={getColor(theme, content)}
						onChange={(value) => setThemeColor(content, value)}
					/>
					<Button
						variant={theme.auto[content] ? 'secondary' : 'outline'}
						size='xs'
						disabled={theme.auto[content]}
						title='Pick a readable content color automatically'
						onClick={() => setThemeAuto(content)}
					>
						Auto
					</Button>
				</div>
			)}
		</div>
	)
}
