import { useState } from 'react'
import { DownloadIcon, ListChecksIcon, LoaderCircleIcon } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n'
import { AuditDialog } from '@/editor/AuditDialog'
import { flushSave } from '@/store/autosave'
import {
	auditDocument,
	hasBlockingIssues,
	type AuditIssue,
} from '@/store/audit'
import { useDocument } from '@/store/document'

const kilobytes = (bytes: number) =>
	t('export.size', { n: Math.round(bytes / 1024) })

// Saves pending edits, writes dist/ and offers to open it
export function ExportButton() {
	const [busy, setBusy] = useState(false)
	const [issues, setIssues] = useState<AuditIssue[] | null>(null)
	const [blocking, setBlocking] = useState(false)

	const audit = () => {
		const doc = useDocument.getState().doc
		return doc ? auditDocument(doc) : []
	}

	// Export waits for a look at the issues, info alone does not stop it
	function start() {
		const found = audit()
		if (hasBlockingIssues(found)) {
			setBlocking(true)
			setIssues(found)
		} else void run()
	}

	function check() {
		setBlocking(false)
		setIssues(audit())
	}

	async function run() {
		setBusy(true)
		try {
			await flushSave()
			const result = await api.exportSite()
			const summary = t('export.summary', {
				pages: result.pages.length,
				files: result.files,
				css: kilobytes(result.cssBytes),
			})
			const reveal = {
				label: t('export.openFolder'),
				onClick: () =>
					void api
						.reveal('dist')
						.catch((e: Error) => toast.error(e.message)),
			}
			if (result.warnings.length) {
				toast.warning(
					t('export.warnings', { count: result.warnings.length }),
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
				toast.success(t('export.done'), {
					description: summary,
					action: reveal,
					duration: 10000,
				})
			}
		} catch (e) {
			toast.error(t('export.failed', { message: (e as Error).message }))
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			<Button
				size='icon-sm'
				variant='outline'
				aria-label={t('audit.button')}
				title={t('audit.buttonTitle')}
				onClick={check}
			>
				<ListChecksIcon />
			</Button>
			<Button
				size='sm'
				data-action='export'
				disabled={busy}
				onClick={start}
			>
				{busy ? (
					<LoaderCircleIcon className='animate-spin' />
				) : (
					<DownloadIcon />
				)}
				{t('export.button')}
			</Button>
			<AuditDialog
				open={issues !== null}
				issues={issues ?? []}
				onOpenChange={(open) => !open && setIssues(null)}
				onExport={
					blocking
						? () => {
								setIssues(null)
								void run()
							}
						: undefined
				}
			/>
		</>
	)
}
