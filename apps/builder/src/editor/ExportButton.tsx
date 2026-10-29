import { useState } from 'react'
import { DownloadIcon, LoaderCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { flushSave } from '@/store/autosave'

const kilobytes = (bytes: number) => `${Math.round(bytes / 1024)} KB`

// Saves pending edits, writes dist/ and offers to open it
export function ExportButton() {
	const [busy, setBusy] = useState(false)

	async function run() {
		setBusy(true)
		try {
			await flushSave()
			const result = await api.exportSite()
			const summary = `${result.pages.length} pages, ${result.files} files, CSS ${kilobytes(result.cssBytes)}`
			const reveal = {
				label: 'Open folder',
				onClick: () =>
					void api
						.reveal('dist')
						.catch((e: Error) => toast.error(e.message)),
			}
			if (result.warnings.length) {
				toast.warning(
					`Exported with ${result.warnings.length} warnings`,
					{
						description: [
							summary,
							...result.warnings.slice(0, 5),
						].join('\n'),
						action: reveal,
						duration: 15000,
					}
				)
			} else {
				toast.success('Site exported to dist', {
					description: summary,
					action: reveal,
					duration: 10000,
				})
			}
		} catch (e) {
			toast.error(`Export failed: ${(e as Error).message}`)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Button size='sm' disabled={busy} onClick={() => void run()}>
			{busy ? (
				<LoaderCircleIcon className='animate-spin' />
			) : (
				<DownloadIcon />
			)}
			Export
		</Button>
	)
}
