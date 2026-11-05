import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { sectionOf } from '@ui-system/core'
import { groups, elementCategories } from '@ui-system/blocks'
import { sectionPresets, sectionCategories } from '@ui-system/blocks/sections'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useRoots } from '@/editor/canvas/useRoots'
import { insertBlocker, insertPlace } from '@/editor/navigator/insertTarget'
import { groupElements } from '@/editor/panels/elementGroups'
import {
	filterItems,
	type PaletteGroup,
	type PaletteItem,
} from '@/editor/paletteItems'
import { categoryName, groupName, sectionName } from '@/i18n/names'
import { insertElement, placePreset } from '@/store/actions'
import { useDocument } from '@/store/document'
import { addPage } from '@/store/pageActions'
import { useCurrentPage, useProject } from '@/store/project'
import { useUi } from '@/store/ui'

// The library never changes while the app runs
const ELEMENT_ENTRIES = groupElements(groups, elementCategories, '').flatMap(
	(group) =>
		group.entries.flatMap((entry) =>
			entry.variants.map((variant) => ({
				id: `${entry.slug}/${variant.id}`,
				name: entry.name,
				title: variant.title,
				group: groupName(group.id, group.name),
				html: variant.html,
			}))
		)
)

const GROUP_LABEL = {
	action: 'palette.actions',
	page: 'palette.pages',
	section: 'palette.sections',
	element: 'palette.elements',
} as const satisfies Record<PaletteGroup, string>

// Ctrl+K: jump to a page, insert a section or element, run an action
export function CommandPalette() {
	const open = useUi((s) => s.palette)
	const setPalette = useUi((s) => s.setPalette)
	return (
		<Dialog open={open} onOpenChange={setPalette}>
			{open && <PaletteBody />}
		</Dialog>
	)
}

// Clicks a toolbar button that owns the real behavior
const clickAction = (name: string) =>
	document.querySelector<HTMLElement>(`[data-action="${name}"]`)?.click()

function PaletteBody() {
	const { t } = useTranslation()
	const roots = useRoots()
	const page = useCurrentPage()
	const site = useDocument((s) => s.doc?.site)
	const pagesById = useDocument((s) => s.doc?.pages)
	const selectedId = useProject((s) => s.selectedId)
	const editing = useProject((s) => s.editingComponentId !== null)
	const [query, setQuery] = useState('')
	const [active, setActive] = useState(0)
	const listRef = useRef<HTMLUListElement>(null)

	const items = useMemo(() => {
		const list: PaletteItem[] = []
		const undo = () => useDocument.getState().undo()
		const redo = () => useDocument.getState().redo()
		const actions: [string, string, () => void][] = [
			['undo', t('top.undo'), undo],
			['redo', t('top.redo'), redo],
			['export', t('export.button'), () => clickAction('export')],
			[
				'preview',
				t('speed.preview'),
				() => useUi.getState().setPreview(true),
			],
			[
				'reveals',
				t('reveal.overviewTitle'),
				() => {
					useUi.getState().setPreview(false)
					useUi.getState().setReveals(true)
				},
			],
			[
				'settings',
				t('settings.title'),
				() => clickAction('site-settings'),
			],
			[
				'addPage',
				t('palette.addPage'),
				() => {
					const name = window.prompt(t('palette.addPagePrompt'))
					if (name?.trim()) addPage(name)
				},
			],
		]
		for (const [id, label, run] of actions) {
			list.push({ id: `action:${id}`, group: 'action', label, run })
		}
		for (const id of site?.pages ?? []) {
			const p = pagesById?.[id]
			if (!p) continue
			list.push({
				id: `page:${id}`,
				group: 'page',
				label: p.name,
				hint: `${p.slug}.html`,
				run: () => useProject.getState().setCurrentPage(id),
			})
		}
		// After the selected section, or at the end of the page
		const sections = page?.sections ?? []
		const owner = selectedId ? sectionOf(roots, selectedId) : null
		const at = sections.findIndex((s) => s.id === owner?.id)
		for (const preset of sectionPresets) {
			const category = sectionCategories.find(
				(c) => c.id === preset.category
			)
			list.push({
				id: `section:${preset.id}`,
				group: 'section',
				label: sectionName(preset.name),
				hint: category ? categoryName(category) : undefined,
				run: () => {
					try {
						placePreset(preset.id, at < 0 ? undefined : at + 1)
					} catch (e) {
						toast.error((e as Error).message)
					}
				},
			})
		}
		const place = insertPlace(roots, selectedId, editing)
		for (const entry of ELEMENT_ENTRIES) {
			list.push({
				id: `element:${entry.id}`,
				group: 'element',
				label: `${entry.name}: ${entry.title}`,
				hint: entry.group,
				run: () => {
					if (!place) {
						toast.error(
							insertBlocker(roots, selectedId, editing) ?? ''
						)
						return
					}
					insertElement(
						place.parentId,
						place.index,
						entry.html
					).catch((e: Error) => toast.error(e.message))
				},
			})
		}
		return list
	}, [t, site, pagesById, page, roots, selectedId, editing])

	const shown = useMemo(() => filterItems(items, query), [items, query])
	const current = Math.min(active, shown.length - 1)

	useEffect(() => {
		listRef.current
			?.querySelector('[aria-selected="true"]')
			?.scrollIntoView({ block: 'nearest' })
	}, [current, shown])

	const run = (item: PaletteItem | undefined) => {
		if (!item) return
		useUi.getState().setPalette(false)
		// Let the dialog finish closing before another one opens
		setTimeout(item.run, 50)
	}

	return (
		<DialogContent
			showCloseButton={false}
			className='top-[20%] flex max-h-[60svh] translate-y-0 flex-col gap-2 sm:max-w-lg'
		>
			<DialogTitle className='sr-only'>{t('palette.title')}</DialogTitle>
			<Input
				autoFocus
				value={query}
				placeholder={t('palette.placeholder')}
				onChange={(e) => {
					setQuery(e.target.value)
					setActive(0)
				}}
				onKeyDown={(e) => {
					if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
						e.preventDefault()
						const step = e.key === 'ArrowDown' ? 1 : -1
						setActive(
							(current + step + shown.length) %
								Math.max(shown.length, 1)
						)
					} else if (e.key === 'Enter') {
						e.preventDefault()
						run(shown[current])
					}
				}}
			/>
			{shown.length === 0 ? (
				<p className='text-muted-foreground px-1 py-4 text-center text-sm'>
					{t('palette.empty')}
				</p>
			) : (
				<ul ref={listRef} role='listbox' className='overflow-y-auto'>
					{shown.map((item, i) => (
						<li key={item.id} role='presentation'>
							{(i === 0 || shown[i - 1].group !== item.group) && (
								<p className='text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium'>
									{t(GROUP_LABEL[item.group])}
								</p>
							)}
							<div
								role='option'
								aria-selected={i === current}
								className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm ${i === current ? 'text-accent-foreground bg-accent' : ''}`}
								onMouseMove={() => setActive(i)}
								onClick={() => run(item)}
							>
								<span className='truncate'>{item.label}</span>
								{item.hint && (
									<span className='text-muted-foreground shrink-0 text-xs'>
										{item.hint}
									</span>
								)}
							</div>
						</li>
					))}
				</ul>
			)}
		</DialogContent>
	)
}
