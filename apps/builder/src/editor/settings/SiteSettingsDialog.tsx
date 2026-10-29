import { SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FontSettings } from '@/editor/settings/FontSettings'
import { GeneralSettings } from '@/editor/settings/GeneralSettings'
import { ThemeSettings } from '@/editor/settings/ThemeSettings'

const TABS = [
	{ id: 'general', label: 'General', Panel: GeneralSettings },
	{ id: 'theme', label: 'Theme', Panel: ThemeSettings },
	{ id: 'fonts', label: 'Fonts', Panel: FontSettings },
] as const

// Site-wide settings, each tab edits the document directly so undo works
export function SiteSettingsDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='ghost' size='sm'>
					<SettingsIcon /> Site settings
				</Button>
			</DialogTrigger>
			<DialogContent className='flex max-h-[85svh] flex-col sm:max-w-3xl'>
				<DialogHeader>
					<DialogTitle>Site settings</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue='general' className='min-h-0 flex-1'>
					<TabsList>
						{TABS.map(({ id, label }) => (
							<TabsTrigger key={id} value={id}>
								{label}
							</TabsTrigger>
						))}
					</TabsList>
					{TABS.map(({ id, Panel }) => (
						<TabsContent
							key={id}
							value={id}
							className='min-h-0 overflow-auto'
						>
							<Panel />
						</TabsContent>
					))}
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
