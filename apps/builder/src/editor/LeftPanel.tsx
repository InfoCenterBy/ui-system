import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SectionsPanel } from '@/editor/panels/SectionsPanel'

const TABS = ['Sections', 'Pages', 'Layers'] as const

export function LeftPanel() {
	return (
		<Tabs defaultValue='Sections' className='h-full gap-0'>
			<TabsList className='m-2'>
				{TABS.map((t) => (
					<TabsTrigger key={t} value={t}>
						{t}
					</TabsTrigger>
				))}
			</TabsList>
			{TABS.map((t) => (
				<TabsContent key={t} value={t} className='min-h-0'>
					<ScrollArea className='h-full'>
						{t === 'Sections' ? (
							<SectionsPanel />
						) : (
							<p className='text-muted-foreground p-3 text-sm'>
								{t} go here.
							</p>
						)}
					</ScrollArea>
				</TabsContent>
			))}
		</Tabs>
	)
}
