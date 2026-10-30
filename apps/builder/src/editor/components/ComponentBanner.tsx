import { useEffect } from 'react'
import { ComponentIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { instancesIn } from '@/editor/components/instances'
import { useNav } from '@/editor/navigator/navState'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

// Strip above the editor while a master is edited
export function ComponentBanner() {
	const id = useProject((s) => s.editingComponentId)
	const name = useDocument((s) => (id ? s.doc?.components[id]?.name : null))
	const count = useDocument((s) =>
		id && s.doc ? instancesIn(s.doc, id).length : 0
	)
	const exit = useProject((s) => s.exitComponent)
	const rootId = useDocument((s) =>
		id ? s.doc?.components[id]?.root.id : undefined
	)
	const exists = name !== undefined && name !== null

	// The component can vanish through undo or delete
	useEffect(() => {
		if (id && !exists) exit()
	}, [id, exists, exit])

	// The master root starts open in the navigator
	useEffect(() => {
		if (rootId) useNav.getState().setOpen([rootId])
	}, [rootId])

	if (!id || !exists) return null
	return (
		<div className='flex h-9 shrink-0 items-center gap-2 border-b bg-purple-600 px-3 text-sm text-white'>
			<ComponentIcon className='size-4' />
			<span className='truncate'>
				Editing component <strong>{name}</strong> — changes apply to{' '}
				{count} {count === 1 ? 'instance' : 'instances'}
			</span>
			<Button
				size='xs'
				variant='secondary'
				className='ml-auto'
				title='Back to the page (Esc)'
				onClick={exit}
			>
				Done
			</Button>
		</div>
	)
}
