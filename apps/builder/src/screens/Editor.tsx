import { useEffect } from 'react'
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ComponentBanner } from '@/editor/components/ComponentBanner'
import { Canvas } from '@/editor/Canvas'
import { LeftPanel } from '@/editor/LeftPanel'
import { Properties } from '@/editor/Properties'
import { TopBar } from '@/editor/TopBar'
import { useShortcuts } from '@/editor/useShortcuts'
import { CommandPalette } from '@/editor/CommandPalette'
import { startAutosave } from '@/store/autosave'
import { useUi } from '@/store/ui'

export function Editor() {
	useShortcuts()
	const preview = useUi((s) => s.preview)
	useEffect(() => startAutosave(), [])
	// Leaving the editor must not leave preview on for the next project
	useEffect(() => () => useUi.getState().setPreview(false), [])
	if (preview) {
		return (
			<div className='flex h-svh flex-col'>
				<TopBar />
				<div className='min-h-0 flex-1'>
					<Canvas />
				</div>
				<CommandPalette />
			</div>
		)
	}
	return (
		<div className='flex h-svh flex-col'>
			<TopBar />
			<ComponentBanner />
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
			<CommandPalette />
		</div>
	)
}
