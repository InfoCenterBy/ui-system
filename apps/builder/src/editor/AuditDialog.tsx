import { AlertCircleIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'
import type { AuditIssue, AuditLevel } from '@/store/audit'

const ICONS = {
	error: AlertCircleIcon,
	warning: AlertTriangleIcon,
	info: InfoIcon,
} satisfies Record<AuditLevel, unknown>

const COLORS: Record<AuditLevel, string> = {
	error: 'text-destructive',
	warning: 'text-amber-500',
	info: 'text-muted-foreground',
}

const LEVEL_KEYS = {
	error: 'audit.levelError',
	warning: 'audit.levelWarning',
	info: 'audit.levelInfo',
} as const

interface Props {
	open: boolean
	issues: AuditIssue[]
	onOpenChange: (open: boolean) => void
	// Set when the dialog stops an export
	onExport?: () => void
}

// Issues grouped by page, the site group first
export function AuditDialog({ open, issues, onOpenChange, onExport }: Props) {
	const { t } = useTranslation()
	const pages = useDocument((s) => s.doc?.pages)
	const groups = new Map<string | undefined, AuditIssue[]>()
	for (const issue of issues) {
		const list = groups.get(issue.pageId) ?? []
		list.push(issue)
		groups.set(issue.pageId, list)
	}
	const ordered = [...groups].sort(
		([a], [b]) => Number(b === undefined) - Number(a === undefined)
	)

	const message = (issue: AuditIssue) => {
		const text = String(issue.params?.text ?? '')
		return t(`audit.${issue.code.replace('.', '_')}` as 'audit.title', {
			...issue.params,
			text: text ? `: "${text}"` : '',
		})
	}

	const show = (issue: AuditIssue) => {
		const project = useProject.getState()
		if (issue.pageId) project.setCurrentPage(issue.pageId)
		if (issue.nodeId) project.select(issue.nodeId)
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85svh] flex-col sm:max-w-xl'>
				<DialogHeader>
					<DialogTitle>{t('audit.title')}</DialogTitle>
					<DialogDescription>
						{t('audit.description')}
					</DialogDescription>
				</DialogHeader>
				<div className='-mx-1 flex min-h-0 flex-col gap-4 overflow-y-auto px-1'>
					{issues.length === 0 && (
						<p className='text-muted-foreground'>
							{t('audit.allGood')}
						</p>
					)}
					{ordered.map(([pageId, list]) => (
						<section
							key={pageId ?? 'site'}
							className='flex flex-col gap-1'
						>
							<h3 className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
								{pageId
									? (pages?.[pageId]?.name ?? pageId)
									: t('audit.site')}
							</h3>
							{list.map((issue, i) => {
								const Icon = ICONS[issue.level]
								return (
									<div
										key={i}
										className='flex items-start gap-2 py-1'
									>
										<Icon
											aria-label={t(
												LEVEL_KEYS[issue.level]
											)}
											className={`mt-0.5 size-4 shrink-0 ${COLORS[issue.level]}`}
										/>
										<span className='min-w-0 flex-1'>
											{message(issue)}
										</span>
										{issue.pageId && (
											<Button
												size='xs'
												variant='outline'
												onClick={() => show(issue)}
											>
												{t('audit.show')}
											</Button>
										)}
									</div>
								)
							})}
						</section>
					))}
				</div>
				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						{t(onExport ? 'audit.cancel' : 'common.close')}
					</Button>
					{onExport && (
						<Button onClick={onExport}>
							{t('audit.exportAnyway')}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
