import { Switch } from '@/components/ui/switch'
import { useTranslation } from 'react-i18next'
import { useDocument } from '@/store/document'
import { setMenuSync } from '@/store/pageActions'

// Header menus follow the page list, turning it on fills them at once
export function MenuSyncField() {
	const { t } = useTranslation()
	const on = useDocument((s) => s.doc?.site.layout?.menuSync ?? false)
	return (
		<div className='flex items-start justify-between gap-4 text-sm'>
			<label htmlFor='menu-sync' className='flex flex-col gap-1'>
				{t('menu.sync')}
				<span className='text-muted-foreground text-xs'>
					{t('menu.syncHint')}
				</span>
			</label>
			<Switch id='menu-sync' checked={on} onCheckedChange={setMenuSync} />
		</div>
	)
}
