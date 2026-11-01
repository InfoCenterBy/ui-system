import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import type { SectionPreset } from '@ui-system/core'
import { sectionCategories, sectionPresets } from '@ui-system/blocks/sections'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { presetDrag } from '@/editor/dnd'
import { usePresetCss } from '@/editor/panels/presetCss'
import { SectionPreview } from '@/editor/panels/SectionPreview'
import { groupSections, parseOpenIds } from '@/editor/panels/sectionGroups'
import { useTranslation } from 'react-i18next'
import { categoryName, sectionName } from '@/i18n/names'
import { placePreset } from '@/store/actions'

function PresetCard({
	preset,
	css,
}: {
	preset: SectionPreset
	css: string | null
}) {
	const { t } = useTranslation()
	const ref = useRef<HTMLDivElement>(null)
	const [dragging, setDragging] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		return draggable({
			element: el,
			getInitialData: () => ({ ...presetDrag(preset.id) }),
			onDragStart: () => setDragging(true),
			onDrop: () => setDragging(false),
		})
	}, [preset.id])

	const add = () => {
		try {
			placePreset(preset.id)
		} catch (e) {
			toast.error((e as Error).message)
		}
	}

	return (
		<div
			ref={ref}
			role='button'
			tabIndex={0}
			aria-label={t('common.addNamed', {
				name: sectionName(preset.name),
			})}
			onClick={add}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					add()
				}
			}}
			className={`hover:border-ring focus-visible:ring-ring/50 flex cursor-grab flex-col gap-1 rounded-md border border-transparent p-1 outline-none focus-visible:ring-[3px] ${dragging ? 'opacity-50' : ''}`}
		>
			<SectionPreview preset={preset} css={css} />
			<span className='px-0.5 text-xs'>{sectionName(preset.name)}</span>
		</div>
	)
}

const STORAGE_KEY = 'builder.sections.open'

const loadOpen = () => {
	try {
		return new Set(parseOpenIds(localStorage.getItem(STORAGE_KEY)))
	} catch {
		return new Set<string>()
	}
}

const saveOpen = (open: Set<string>) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...open]))
	} catch {
		// storage can be unavailable
	}
}

export function SectionsPanel() {
	const { t } = useTranslation()
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(loadOpen)
	const css = usePresetCss()
	const searching = query.trim() !== ''

	const groups = useMemo(
		() => groupSections(sectionCategories, sectionPresets, query),
		[query]
	)

	const update = (next: Set<string>) => {
		setOpen(next)
		saveOpen(next)
	}
	const toggle = (id: string) => {
		const next = new Set(open)
		if (!next.delete(id)) next.add(id)
		update(next)
	}

	return (
		<div className='flex flex-col gap-2 p-3'>
			<div className='flex items-center gap-1'>
				<Input
					type='search'
					placeholder={t('sections.search')}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<Button
					variant='ghost'
					size='icon-sm'
					title={t('common.expandAll')}
					aria-label={t('common.expandAll')}
					onClick={() =>
						update(new Set(sectionCategories.map((c) => c.id)))
					}
				>
					<ChevronsUpDown />
				</Button>
				<Button
					variant='ghost'
					size='icon-sm'
					title={t('common.collapseAll')}
					aria-label={t('common.collapseAll')}
					onClick={() => update(new Set())}
				>
					<ChevronsDownUp />
				</Button>
			</div>
			{groups.length === 0 && (
				<p className='text-muted-foreground text-sm'>
					{t('sections.none')}
				</p>
			)}
			{groups.map(({ category, presets }) => {
				const expanded = searching || open.has(category.id)
				const bodyId = `sections-${category.id}`
				return (
					<section key={category.id} className='flex flex-col gap-1'>
						<button
							type='button'
							aria-expanded={expanded}
							aria-controls={bodyId}
							onClick={() => toggle(category.id)}
							className='focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-md px-1 py-1 text-left text-sm outline-none hover:bg-accent focus-visible:ring-[3px]'
						>
							<ChevronRight
								className={`text-muted-foreground size-3.5 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
							/>
							<span className='flex-1 truncate font-medium'>
								{categoryName(category)}
							</span>
							<span className='text-muted-foreground text-xs'>
								{presets.length}
							</span>
						</button>
						{expanded && (
							<div id={bodyId} className='flex flex-col gap-1'>
								{presets.map((preset) => (
									<PresetCard
										key={preset.id}
										preset={preset}
										css={css}
									/>
								))}
							</div>
						)}
					</section>
				)
			})}
		</div>
	)
}
