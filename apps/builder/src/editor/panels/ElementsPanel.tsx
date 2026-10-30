import { useEffect, useMemo, useRef, useState } from 'react'
import {
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { sectionOf } from '@ui-system/core'
import { groups, elementCategories } from '@ui-system/blocks'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoots } from '@/editor/canvas/useRoots'
import { elementDrag } from '@/editor/dnd'
import { insertBlocker, insertPlace } from '@/editor/navigator/insertTarget'
import { useElementCss } from '@/editor/panels/elementCss'
import { groupElements, type ElementEntry } from '@/editor/panels/elementGroups'
import { ElementPreview } from '@/editor/panels/ElementPreview'
import { parseOpenIds } from '@/editor/panels/sectionGroups'
import { addCustomBlock, insertElement } from '@/store/actions'
import { useCurrentPage, useProject } from '@/store/project'

const STORAGE_KEY = 'builder.elements.open'

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

function VariantItem({
	id,
	title,
	html,
	css,
	enabled,
	onAdd,
}: {
	id: string
	title: string
	html: string
	css: string | null
	enabled: boolean
	onAdd: (html: string) => void
}) {
	const ref = useRef<HTMLDivElement>(null)
	const [dragging, setDragging] = useState(false)

	useEffect(() => {
		const el = ref.current
		if (!el) return
		return draggable({
			element: el,
			// Dropping on the canvas does not need a selection
			getInitialData: () => ({ ...elementDrag(html) }),
			onDragStart: () => setDragging(true),
			onDrop: () => setDragging(false),
		})
	}, [html])

	return (
		<div
			ref={ref}
			role='button'
			tabIndex={0}
			aria-label={`Add ${title}`}
			aria-disabled={!enabled}
			data-variant={id}
			onClick={() => onAdd(html)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					onAdd(html)
				}
			}}
			className={`focus-visible:ring-ring/50 hover:border-ring flex cursor-grab flex-col gap-1 rounded-md border border-transparent p-1 outline-none focus-visible:ring-[3px] ${enabled ? '' : 'opacity-70'} ${dragging ? 'opacity-50' : ''}`}
		>
			<ElementPreview html={html} css={css} title={title} />
			<span className='px-0.5 text-xs'>{title}</span>
		</div>
	)
}

function Entry({
	entry,
	expanded,
	onToggle,
	css,
	enabled,
	onAdd,
}: {
	entry: ElementEntry
	expanded: boolean
	onToggle: () => void
	css: string | null
	enabled: boolean
	onAdd: (html: string) => void
}) {
	const bodyId = `elements-${entry.slug}`
	return (
		<section className='flex flex-col gap-1'>
			<button
				type='button'
				aria-expanded={expanded}
				aria-controls={bodyId}
				onClick={onToggle}
				className='focus-visible:ring-ring/50 flex items-center gap-1.5 rounded-md px-1 py-1 text-left text-sm outline-none hover:bg-accent focus-visible:ring-[3px]'
			>
				<ChevronRight
					className={`text-muted-foreground size-3.5 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
				/>
				<span className='flex-1 truncate'>{entry.name}</span>
				<span className='text-muted-foreground text-xs'>
					{entry.variants.length}
				</span>
			</button>
			{expanded && (
				<div id={bodyId} className='flex flex-col gap-1 pl-3'>
					{entry.variants.map((v) => (
						<VariantItem
							key={v.id}
							id={v.id}
							title={v.title}
							html={v.html}
							css={css}
							enabled={enabled}
							onAdd={onAdd}
						/>
					))}
				</div>
			)}
		</section>
	)
}

export function ElementsPanel() {
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(loadOpen)
	const css = useElementCss()
	const roots = useRoots()
	const selectedId = useProject((s) => s.selectedId)
	const editing = useProject((s) => s.editingComponentId !== null)
	const page = useCurrentPage()
	const blocker = insertBlocker(roots, selectedId, editing)
	const searching = query.trim() !== ''

	const sections = useMemo(
		() => groupElements(groups, elementCategories, query),
		[query]
	)
	const allSlugs = () =>
		new Set(
			groupElements(groups, elementCategories, '').flatMap((g) =>
				g.entries.map((e) => e.slug)
			)
		)

	const update = (next: Set<string>) => {
		setOpen(next)
		saveOpen(next)
	}
	const toggle = (slug: string) => {
		const next = new Set(open)
		if (!next.delete(slug)) next.add(slug)
		update(next)
	}

	const add = (html: string) => {
		const place = insertPlace(roots, selectedId, editing)
		if (!place) return
		insertElement(place.parentId, place.index, html).catch((e: Error) =>
			toast.error(e.message)
		)
	}

	// After the selected section, or at the end of the page
	const addBlock = () => {
		const sections = page?.sections ?? []
		const section = selectedId ? sectionOf(roots, selectedId) : null
		const at = sections.findIndex((s) => s.id === section?.id)
		addCustomBlock(at < 0 ? sections.length : at + 1).catch((e: Error) =>
			toast.error(e.message)
		)
	}

	return (
		<div className='flex flex-col gap-2 p-3'>
			<Button
				variant='outline'
				size='sm'
				disabled={editing}
				title={
					editing
						? 'Not available while editing a component'
						: 'Add a Custom block after the selected section'
				}
				onClick={addBlock}
			>
				<Plus />
				Add empty block
			</Button>
			<div className='flex items-center gap-1'>
				<Input
					type='search'
					placeholder='Search elements'
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<Button
					variant='ghost'
					size='icon-sm'
					title='Expand all'
					aria-label='Expand all'
					onClick={() => update(allSlugs())}
				>
					<ChevronsUpDown />
				</Button>
				<Button
					variant='ghost'
					size='icon-sm'
					title='Collapse all'
					aria-label='Collapse all'
					onClick={() => update(new Set())}
				>
					<ChevronsDownUp />
				</Button>
			</div>
			{blocker && (
				<p
					role='status'
					className='text-muted-foreground bg-muted rounded-md px-2 py-1.5 text-xs'
				>
					{blocker}
				</p>
			)}
			{sections.length === 0 && (
				<p className='text-muted-foreground text-sm'>
					No elements found
				</p>
			)}
			{sections.map((group) => (
				<div key={group.id} className='flex flex-col gap-1'>
					<h3 className='text-muted-foreground px-1 pt-2 text-xs font-medium uppercase'>
						{group.name}
					</h3>
					{group.entries.map((entry) => (
						<Entry
							key={entry.slug}
							entry={entry}
							expanded={searching || open.has(entry.slug)}
							onToggle={() => toggle(entry.slug)}
							css={css}
							enabled={blocker === null}
							onAdd={add}
						/>
					))}
				</div>
			))}
		</div>
	)
}
