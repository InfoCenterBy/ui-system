import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { SectionPreset } from '@ui-system/core'
import { sectionCategories, sectionPresets } from '@ui-system/blocks/sections'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Input } from '@/components/ui/input'
import { presetDrag } from '@/editor/dnd'
import { usePresetCss } from '@/editor/panels/presetCss'
import { SectionPreview } from '@/editor/panels/SectionPreview'
import { addSection } from '@/store/actions'

function PresetCard({
	preset,
	css,
}: {
	preset: SectionPreset
	css: string | null
}) {
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
			addSection(preset.id)
		} catch (e) {
			toast.error((e as Error).message)
		}
	}

	return (
		<div
			ref={ref}
			role='button'
			tabIndex={0}
			aria-label={`Add ${preset.name}`}
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
			<span className='px-0.5 text-xs'>{preset.name}</span>
		</div>
	)
}

export function SectionsPanel() {
	const [query, setQuery] = useState('')
	const css = usePresetCss()

	const groups = useMemo(() => {
		const q = query.trim().toLowerCase()
		return sectionCategories
			.map((category) => ({
				category,
				presets: sectionPresets.filter(
					(p) =>
						p.category === category.id &&
						(!q ||
							p.name.toLowerCase().includes(q) ||
							category.name.toLowerCase().includes(q))
				),
			}))
			.filter((g) => g.presets.length > 0)
	}, [query])

	return (
		<div className='flex flex-col gap-3 p-3'>
			<Input
				type='search'
				placeholder='Search sections'
				value={query}
				onChange={(e) => setQuery(e.target.value)}
			/>
			{groups.length === 0 && (
				<p className='text-muted-foreground text-sm'>
					No sections found
				</p>
			)}
			{groups.map(({ category, presets }) => (
				<section key={category.id} className='flex flex-col gap-1'>
					<h3 className='text-muted-foreground text-xs font-medium'>
						{category.name}
					</h3>
					{presets.map((preset) => (
						<PresetCard key={preset.id} preset={preset} css={css} />
					))}
				</section>
			))}
		</div>
	)
}
