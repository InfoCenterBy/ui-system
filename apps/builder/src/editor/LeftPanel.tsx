import { useCallback, useEffect, useRef, useState } from 'react'
import {
	ComponentIcon,
	Files,
	Layers,
	LayoutTemplate,
	Shapes,
} from 'lucide-react'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { asElement } from '@/editor/dnd'
import { ComponentsPanel } from '@/editor/panels/ComponentsPanel'
import { ElementsPanel } from '@/editor/panels/ElementsPanel'
import { LayersPanel } from '@/editor/panels/LayersPanel'
import { PagesPanel } from '@/editor/panels/PagesPanel'
import { SectionsPanel } from '@/editor/panels/SectionsPanel'

const TABS = [
	{ value: 'Sections', icon: LayoutTemplate },
	{ value: 'Elements', icon: Shapes },
	{ value: 'Pages', icon: Files },
	{ value: 'Layers', icon: Layers },
	{ value: 'Components', icon: ComponentIcon },
] as const

const HOVER_MS = 400

// An element dragged over the Layers tab opens it, so it can be dropped on a row
function useOpenOnDrag(onOpen: () => void) {
	const ref = useRef<HTMLButtonElement>(null)
	useEffect(() => {
		const el = ref.current
		if (!el) return
		let timer: ReturnType<typeof setTimeout> | undefined
		const stop = () => clearTimeout(timer)
		const cleanup = dropTargetForElements({
			element: el,
			canDrop: ({ source }) => asElement(source.data) !== null,
			onDragEnter: () => {
				timer = setTimeout(onOpen, HOVER_MS)
			},
			onDragLeave: stop,
			onDrop: stop,
		})
		return () => {
			stop()
			cleanup()
		}
	}, [onOpen])
	return ref
}

export function LeftPanel() {
	const [tab, setTab] = useState('Sections')
	const openLayers = useCallback(() => setTab('Layers'), [])
	const layersRef = useOpenOnDrag(openLayers)
	return (
		<Tabs
			value={tab}
			onValueChange={setTab}
			className='@container h-full gap-0'
		>
			<TabsList className='m-2 w-[calc(100%-1rem)]'>
				{TABS.map(({ value, icon: Icon }) => (
					<TabsTrigger
						key={value}
						ref={value === 'Layers' ? layersRef : undefined}
						value={value}
						title={value}
						className='min-w-0 truncate @max-[20rem]:px-0.5 @max-[20rem]:text-xs @max-[20rem]:data-[state=active]:flex-3'
					>
						<Icon />
						{/* On a narrow panel only the open tab keeps its label */}
						<span className='truncate @max-[20rem]:[[data-state=inactive]>&]:sr-only'>
							{value}
						</span>
					</TabsTrigger>
				))}
			</TabsList>
			{TABS.map(({ value }) => (
				<TabsContent key={value} value={value} className='min-h-0'>
					<ScrollArea className='h-full'>
						{value === 'Sections' ? (
							<SectionsPanel />
						) : value === 'Layers' ? (
							<LayersPanel />
						) : value === 'Elements' ? (
							<ElementsPanel />
						) : value === 'Components' ? (
							<ComponentsPanel />
						) : (
							<PagesPanel />
						)}
					</ScrollArea>
				</TabsContent>
			))}
		</Tabs>
	)
}
