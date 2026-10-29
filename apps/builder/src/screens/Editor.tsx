import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Canvas } from '@/editor/Canvas'
import { LeftPanel } from '@/editor/LeftPanel'
import { Properties } from '@/editor/Properties'
import { TopBar } from '@/editor/TopBar'

export function Editor() {
	return (
		<div className='flex h-svh flex-col'>
			<TopBar />
			<ResizablePanelGroup
				orientation='horizontal'
				className='min-h-0 flex-1'
			>
				<ResizablePanel defaultSize='18%' minSize='12%' maxSize='35%'>
					<LeftPanel />
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize='60%' minSize='30%'>
					<Canvas />
				</ResizablePanel>
				<ResizableHandle />
				<ResizablePanel defaultSize='22%' minSize='15%' maxSize='40%'>
					<Properties />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
