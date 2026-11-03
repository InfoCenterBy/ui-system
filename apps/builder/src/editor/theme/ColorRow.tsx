import { useRef, useState } from 'react'
import {
	CONTENT_OF,
	getColor,
	hexToOklch,
	oklchToHex,
	type ContentKey,
	type Theme,
} from '@ui-system/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n'
import { toOklchString } from '@/editor/theme/parseColor'
import { setThemeAuto, setThemeColor } from '@/store/themeActions'

interface ColorInputProps {
	label: string
	value: string
	onChange: (value: string) => void
}

// Swatch opens the native picker, the text field takes oklch, hex, rgb or hsl
function ColorInput({ label, value, onChange }: ColorInputProps) {
	const picker = useRef<HTMLInputElement>(null)
	const [invalid, setInvalid] = useState(false)
	// Remounts the field so a typed hex is replaced even when the color is unchanged
	const [round, setRound] = useState(0)
	const commit = (text: string) => {
		const clean = text.trim()
		if (clean === value) return setInvalid(false)
		const color = toOklchString(clean)
		setInvalid(!color)
		if (!color) return
		onChange(color)
		setRound((n) => n + 1)
	}
	const open = () => {
		const input = picker.current
		if (!input) return
		// showPicker needs a user gesture, click is the fallback
		try {
			input.showPicker()
		} catch {
			input.click()
		}
	}
	return (
		<div className='relative flex flex-wrap items-center gap-x-2 gap-y-0.5'>
			<button
				type='button'
				aria-label={t('theme.pick', { label })}
				className='border-border focus-visible:ring-ring/50 size-7 shrink-0 rounded-md border outline-none focus-visible:ring-3'
				style={{ background: value }}
				onClick={open}
			/>
			<input
				ref={picker}
				type='color'
				tabIndex={-1}
				aria-hidden
				className='pointer-events-none absolute size-0 opacity-0'
				value={oklchToHex(value)}
				onChange={(e) => {
					setInvalid(false)
					onChange(hexToOklch(e.target.value))
				}}
			/>
			<Input
				key={`${value}:${round}`}
				aria-label={label}
				aria-invalid={invalid || undefined}
				defaultValue={value}
				className='h-7 w-48 font-mono text-xs'
				onChange={() => invalid && setInvalid(false)}
				onBlur={(e) => commit(e.target.value)}
				onKeyDown={(e) =>
					e.key === 'Enter' && commit(e.currentTarget.value)
				}
			/>
			{invalid && (
				<span
					role='alert'
					className='text-destructive w-full pl-9 text-xs'
				>
					{t('colorField.invalid')}
				</span>
			)}
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
						title={t('theme.autoTitle')}
						onClick={() => setThemeAuto(content)}
					>
						{t('theme.auto')}
					</Button>
				</div>
			)}
		</div>
	)
}
