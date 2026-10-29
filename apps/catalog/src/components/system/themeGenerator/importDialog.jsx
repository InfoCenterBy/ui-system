import { useState } from 'react'
import { parseThemeCss } from '@ui-system/theme'
import { toast } from '../../../lib/toast'

const PLACEHOLDER = `@plugin "daisyui/theme" {
	name: "mytheme";
	color-scheme: light;
	--color-primary: oklch(45% 0.24 277);
	...
}`

// Paste an exported theme, or any data-theme block, to keep editing it
const ImportDialog = ({ ref, onImport }) => {
	const [text, setText] = useState('')
	const [error, setError] = useState('')

	const submit = (e) => {
		const result = parseThemeCss(text)
		if (!result) {
			e.preventDefault()
			setError(
				'No theme colors found, paste a block with --color-* values'
			)
			return
		}
		onImport(result.theme)
		setText('')
		setError('')
		if (result.skipped.length) {
			toast.error(`Kept preset values for ${result.skipped.join(', ')}`)
		} else {
			toast.success('Theme imported')
		}
	}

	return (
		<dialog ref={ref} className='modal'>
			<form
				method='dialog'
				className='modal-box flex max-w-2xl flex-col gap-4'
			>
				<h3 className='text-lg font-bold'>Import theme</h3>
				<p className='text-sm text-base-content/70'>
					Paste a <code>@plugin "daisyui/theme"</code> block or a{' '}
					<code>[data-theme]</code> rule. Colors in OKLCH or HEX are
					supported.
				</p>
				<textarea
					className='textarea h-64 w-full font-mono text-xs'
					placeholder={PLACEHOLDER}
					value={text}
					aria-invalid={Boolean(error)}
					onChange={(e) => {
						setText(e.target.value)
						setError('')
					}}
				/>
				{error && <p className='text-sm text-error'>{error}</p>}
				<div className='modal-action mt-0'>
					<button
						className='btn btn-ghost'
						value='cancel'
						formNoValidate
					>
						Cancel
					</button>
					<button
						className='btn btn-primary'
						disabled={!text.trim()}
						onClick={submit}
					>
						Import
					</button>
				</div>
			</form>
			<form method='dialog' className='modal-backdrop'>
				<button>close</button>
			</form>
		</dialog>
	)
}

export default ImportDialog
