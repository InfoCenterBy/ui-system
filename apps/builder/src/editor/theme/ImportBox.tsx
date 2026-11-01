import { useState } from 'react'
import { parseThemeCss } from '@ui-system/theme'
import { Button } from '@/components/ui/button'
import { importTheme } from '@/store/themeActions'
import { t } from '@/i18n'

// Paste a daisyUI theme block, the values become overrides on the matching preset
export function ImportBox() {
	const [open, setOpen] = useState(false)
	const [text, setText] = useState('')
	const [error, setError] = useState('')

	const apply = () => {
		const result = parseThemeCss(text)
		if (!result) {
			setError(t('theme.importError'))
			return
		}
		importTheme(result.theme)
		setText('')
		setError('')
		setOpen(false)
	}

	if (!open) {
		return (
			<Button variant='outline' size='sm' onClick={() => setOpen(true)}>
				{t('theme.import')}
			</Button>
		)
	}
	return (
		<div className='flex w-full flex-col gap-2'>
			<textarea
				aria-label={t('theme.cssAria')}
				value={text}
				onChange={(e) => setText(e.target.value)}
				rows={6}
				placeholder={
					'@plugin "daisyui/theme" {\n\t--color-primary: oklch(45% 0.24 277);\n}'
				}
				className='border-input bg-background rounded-md border p-2 font-mono text-xs'
			/>
			{error && <p className='text-destructive text-xs'>{error}</p>}
			<div className='flex gap-2'>
				<Button size='sm' disabled={!text.trim()} onClick={apply}>
					{t('common.apply')}
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={() => setOpen(false)}
				>
					{t('common.cancel')}
				</Button>
			</div>
		</div>
	)
}
