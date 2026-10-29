import { useState } from 'react'
import Icon from '../icon'
import { themeCss } from '@ui-system/theme'
import { copyText } from '../../../lib/toast'

// Shows the theme as a daisyUI plugin block ready to paste into CSS
const ExportDialog = ({ ref, theme }) => {
	const [isDefault, setIsDefault] = useState(false)
	const [prefersDark, setPrefersDark] = useState(false)
	const css = themeCss(theme, { isDefault, prefersDark })
	const name = theme.name || 'mytheme'

	return (
		<dialog ref={ref} className='modal'>
			<div className='modal-box flex max-w-2xl flex-col gap-4'>
				<form method='dialog'>
					<button
						className='btn absolute top-2 right-2 btn-circle btn-ghost btn-sm'
						aria-label='Close'
					>
						✕
					</button>
				</form>
				<h3 className='text-lg font-bold'>Export theme</h3>
				<p className='text-sm text-base-content/70'>
					Paste the block into your CSS after the daisyUI plugin, then
					set{' '}
					<code className='rounded bg-base-200 px-1'>data-theme</code>{' '}
					to <code className='rounded bg-base-200 px-1'>{name}</code>.
				</p>
				<div className='flex flex-wrap gap-4'>
					<label className='flex cursor-pointer items-center gap-2 text-sm'>
						<input
							type='checkbox'
							className='checkbox checkbox-sm'
							checked={isDefault}
							onChange={(e) => setIsDefault(e.target.checked)}
						/>
						Default theme
					</label>
					<label className='flex cursor-pointer items-center gap-2 text-sm'>
						<input
							type='checkbox'
							className='checkbox checkbox-sm'
							checked={prefersDark}
							onChange={(e) => setPrefersDark(e.target.checked)}
						/>
						Use for prefers dark
					</label>
				</div>
				<pre className='max-h-96 overflow-auto rounded-box bg-base-200 p-4 text-xs leading-relaxed'>
					<code>{css}</code>
				</pre>
				<div className='modal-action mt-0'>
					<button
						className='btn btn-ghost'
						onClick={() => copyText(window.location.href, 'Link')}
					>
						Copy link
					</button>
					<button
						className='btn btn-primary'
						onClick={() => copyText(css, 'CSS')}
					>
						<Icon name='copy' className='size-4' />
						Copy CSS
					</button>
				</div>
			</div>
			<form method='dialog' className='modal-backdrop'>
				<button>close</button>
			</form>
		</dialog>
	)
}

export default ExportDialog
