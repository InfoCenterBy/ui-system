import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Editor } from '@/screens/Editor'
import { StartScreen } from '@/screens/StartScreen'
import { useProject } from '@/store/project'

export default function App() {
	const isOpen = useProject((s) => s.projectPath !== null)
	return (
		<TooltipProvider>
			{isOpen ? <Editor /> : <StartScreen />}
			<Toaster />
		</TooltipProvider>
	)
}
