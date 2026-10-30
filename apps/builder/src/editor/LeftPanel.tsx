import { ComponentIcon, Files, Layers, LayoutTemplate } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComponentsPanel } from '@/editor/panels/ComponentsPanel'
import { LayersPanel } from '@/editor/panels/LayersPanel'
import { PagesPanel } from '@/editor/panels/PagesPanel'
import { SectionsPanel } from '@/editor/panels/SectionsPanel'

const TABS = [
	{ value: 'Sections', icon: LayoutTemplate },
	{ value: 'Pages', icon: Files },
	{ value: 'Layers', icon: Layers },
	{ value: 'Components', icon: ComponentIcon },
] as const

export function LeftPanel() {
	return (
		<Tabs defaultValue='Sections' className='@container h-full gap-0'>
			<TabsList className='m-2 w-[calc(100%-1rem)]'>
				{TABS.map(({ value, icon: Icon }) => (
					<TabsTrigger
						key={value}
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
