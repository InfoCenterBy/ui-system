import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Editor } from '@/screens/Editor'
import { StartScreen } from '@/screens/StartScreen'
import { useTranslation } from 'react-i18next'
import '@/i18n'
import { useProject } from '@/store/project'

export default function App() {
	const isOpen = useProject((s) => s.projectPath !== null)
	// Switching the language rebuilds the screen, so every text and the canvas frame follow it
	const { i18n } = useTranslation()
	const locale = i18n.resolvedLanguage
	return (
		<TooltipProvider>
			{isOpen ? <Editor key={locale} /> : <StartScreen key={locale} />}
			<Toaster />
		</TooltipProvider>
	)
}
