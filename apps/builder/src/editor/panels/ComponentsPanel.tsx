import { useEffect, useMemo, useRef, useState } from 'react'
import { ComponentIcon, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import {
	collectClasses,
	serializeHtml,
	type Component,
	type SectionPreset,
	type Site,
} from '@ui-system/core'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useRoots } from '@/editor/canvas/useRoots'
import { instancesIn } from '@/editor/components/instances'
import { componentDrag } from '@/editor/dnd'
import { insertPlace } from '@/editor/navigator/insertTarget'
import { useNav } from '@/editor/navigator/navState'
import { SectionPreview } from '@/editor/panels/SectionPreview'
import { useTranslation } from 'react-i18next'
import {
	addInstanceSection,
	deleteComponent,
	insertInstance,
	renameComponent,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const fail = (e: unknown) => toast.error((e as Error).message)

// Section components get a thumbnail built like the section presets
const previewOf = (component: Component): SectionPreset => ({
	id: component.id,
	name: component.name,
	category: 'components',
	html: serializeHtml([component.root], { pretty: false }),
})

// CSS for the classes used by the masters, null while loading
function useComponentCss(components: Component[]) {
	const theme = useDocument((s) => s.doc?.site.theme)
	const classKey = [...collectClasses(components.map((c) => c.root))]
		.sort()
		.join(' ')
	const themeKey = theme ? JSON.stringify(theme) : null
	const [css, setCss] = useState<string | null>(null)
	useEffect(() => {
		if (!themeKey) return
		let cancelled = false
		const timer = setTimeout(() => {
			api.css(
				classKey ? classKey.split(' ') : [],
				JSON.parse(themeKey) as Site['theme']
			)
				.then((r) => {
					if (!cancelled) setCss(r.css)
				})
				.catch((error: Error) => console.error(error))
		}, 150)
		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [classKey, themeKey])
	return css
}

function ComponentRow({
	component,
	css,
}: {
	component: Component
	css: string | null
}) {
	const { t } = useTranslation()
	const ref = useRef<HTMLDivElement>(null)
	const [dragging, setDragging] = useState(false)
	const [renaming, setRenaming] = useState(false)
	const [name, setName] = useState(component.name)
	const roots = useRoots()
	const selectedId = useProject((s) => s.selectedId)
	const editing = useProject((s) => s.editingComponentId !== null)
	const isSection = Boolean(component.root.section)
	const preview = useMemo(() => previewOf(component), [component])

	// Section components land between sections, the rest inside unlocked sections
	useEffect(() => {
		const el = ref.current
		if (!el) return
		return draggable({
			element: el,
			getInitialData: () => ({ ...componentDrag(component.id) }),
			onDragStart: () => setDragging(true),
			onDrop: () => setDragging(false),
		})
	}, [component.id])

	const add = () => {
		try {
			if (isSection) {
				addInstanceSection(component.id)
				return
			}
			const place = insertPlace(roots, selectedId, editing)
			if (!place) {
				throw new Error(t('components.selectFirst'))
			}
			insertInstance(component.id, place.parentId, place.index)
			useNav.getState().setOpen([place.parentId])
		} catch (e) {
			fail(e)
		}
	}

	const remove = () => {
		const doc = useDocument.getState().doc
		const count = doc ? instancesIn(doc, component.id).length : 0
		const ok = window.confirm(
			t('components.confirmDelete', { name: component.name, count })
		)
		if (!ok) return
		try {
			deleteComponent(component.id)
		} catch (e) {
			fail(e)
		}
	}

	const rename = () => {
		try {
			if (name.trim() !== component.name) {
				renameComponent(component.id, name)
			}
			setRenaming(false)
		} catch (e) {
			fail(e)
		}
	}

	return (
		<div
			ref={ref}
			className={`hover:border-ring flex flex-col gap-1 rounded-md border border-transparent p-1 ${dragging ? 'opacity-50' : ''}`}
		>
			{isSection && (
				<div
					role='button'
					tabIndex={-1}
					aria-label={t('common.addNamed', { name: component.name })}
					className='cursor-grab'
					onClick={add}
				>
					<SectionPreview preset={preview} css={css} />
				</div>
			)}
			<div className='flex items-center gap-1'>
				{renaming ? (
					<Input
						autoFocus
						value={name}
						aria-label={t('components.name')}
						className='h-7'
						onChange={(e) => setName(e.target.value)}
						onBlur={rename}
						onKeyDown={(e) => {
							if (e.key === 'Enter') rename()
							if (e.key === 'Escape') {
								e.stopPropagation()
								setName(component.name)
								setRenaming(false)
							}
						}}
					/>
				) : (
					<button
						type='button'
						className='flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm outline-none [&_svg]:size-3.5 [&_svg]:shrink-0'
						title={
							isSection
								? t('components.addToPage')
								: t('components.insertInto')
						}
						onClick={add}
					>
						<ComponentIcon className='text-purple-600 dark:text-purple-400' />
						<span className='truncate'>{component.name}</span>
					</button>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant='ghost'
							size='icon-xs'
							aria-label={t('components.actions', {
								name: component.name,
							})}
						>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuItem
							onSelect={() =>
								useProject
									.getState()
									.editComponent(component.id)
							}
						>
							{t('common.edit')}
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								setName(component.name)
								setRenaming(true)
							}}
						>
							{t('common.rename')}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant='destructive'
							onSelect={remove}
						>
							{t('common.delete')}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}

export function ComponentsPanel() {
	const { t } = useTranslation()
	const map = useDocument((s) => s.doc?.components)
	const components = useMemo(
		() =>
			Object.values(map ?? {}).sort((a, b) =>
				a.name.localeCompare(b.name)
			),
		[map]
	)
	const css = useComponentCss(components)
	return (
		<div className='flex flex-col gap-2 p-3'>
			{components.length === 0 && (
				<p className='text-muted-foreground text-sm'>
					{t('components.empty')}
				</p>
			)}
			{components.map((c) => (
				<ComponentRow key={c.id} component={c} css={css} />
			))}
		</div>
	)
}
