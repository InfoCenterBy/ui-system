import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { collectReveals, readRevealConfig, sectionOf } from '@ui-system/core'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { labelOf } from '@/editor/canvas/nodes'
import { useRoots } from '@/editor/canvas/useRoots'
import { REVEAL_LABELS } from '@/editor/properties/revealLabels'
import { useProject } from '@/store/project'
import { useUi } from '@/store/ui'

// All appear-on-scroll animations of the current page, a click selects the element
export function RevealOverview() {
	const open = useUi((s) => s.reveals)
	const setOpen = useUi((s) => s.setReveals)
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{open && <OverviewBody />}
		</Dialog>
	)
}

function OverviewBody() {
	const { t } = useTranslation()
	const roots = useRoots()
	const entries = useMemo(() => collectReveals(roots), [roots])
	const show = (id: string) => {
		useProject.getState().select(id)
		useUi.getState().setReveals(false)
	}
	return (
		<DialogContent className='flex max-h-[85svh] flex-col sm:max-w-xl'>
			<DialogHeader>
				<DialogTitle>{t('reveal.overviewTitle')}</DialogTitle>
				<DialogDescription>
					{t('reveal.overviewHint')}
				</DialogDescription>
			</DialogHeader>
			{entries.length === 0 ? (
				<p className='text-muted-foreground text-sm'>
					{t('reveal.overviewEmpty')}
				</p>
			) : (
				<ul className='-mx-1 flex min-h-0 flex-col overflow-y-auto px-1 text-sm'>
					{entries.map(({ node, reveal, stagger }) => {
						const section = sectionOf(roots, node.id)
						const repeat = 'data-reveal-repeat' in node.attrs
						const kinds = [
							reveal && t(REVEAL_LABELS[reveal.type]),
							stagger &&
								`${t('reveal.stagger')}: ${t(REVEAL_LABELS[stagger.type])}, ${stagger.step} ${t('reveal.ms')}`,
						].filter(Boolean)
						return (
							<li key={node.id}>
								<button
									type='button'
									className='hover:bg-muted flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left'
									onClick={() => show(node.id)}
								>
									<span className='flex items-baseline justify-between gap-3'>
										<span className='truncate font-medium'>
											{labelOf(node)}
										</span>
										<span className='text-muted-foreground shrink-0 text-xs'>
											{kinds.join(' · ')}
										</span>
									</span>
									<span className='text-muted-foreground flex justify-between gap-3 text-xs'>
										<span className='truncate'>
											{section && section.id !== node.id
												? labelOf(section)
												: ''}
										</span>
										<span className='shrink-0'>
											{t('reveal.delay')}:{' '}
											{readRevealConfig(node.attrs).delay}{' '}
											{t('reveal.ms')}
											{repeat
												? ` · ${t('reveal.everyTime')}`
												: ''}
										</span>
									</span>
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</DialogContent>
	)
}
