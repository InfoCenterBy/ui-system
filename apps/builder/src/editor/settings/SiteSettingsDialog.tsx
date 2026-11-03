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
import { useTranslation } from 'react-i18next'

const TABS = [
	{ id: 'general', label: 'settings.general', Panel: GeneralSettings },
	{ id: 'theme', label: 'settings.theme', Panel: ThemeSettings },
	{ id: 'fonts', label: 'settings.fonts', Panel: FontSettings },
] as const

// Site-wide settings, each tab edits the document directly so undo works
export function SiteSettingsDialog() {
	const { t } = useTranslation()
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='ghost' size='sm' data-action='site-settings'>
					<SettingsIcon /> {t('settings.title')}
				</Button>
			</DialogTrigger>
			<DialogContent className='flex max-h-[85svh] flex-col sm:max-w-3xl'>
				<DialogHeader>
					<DialogTitle>{t('settings.title')}</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue='general' className='min-h-0 flex-1'>
					<TabsList>
						{TABS.map(({ id, label }) => (
							<TabsTrigger key={id} value={id}>
								{t(label)}
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
