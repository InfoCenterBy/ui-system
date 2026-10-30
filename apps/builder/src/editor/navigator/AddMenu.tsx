import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRoots } from '@/editor/canvas/useRoots'
import { insertHtml } from '@/store/actions'
import { useProject } from '@/store/project'
import { ELEMENT_PRESETS } from './elementPresets'
import { insertPlace } from './insertTarget'
import { useNav } from './navState'

export function AddMenu() {
	const roots = useRoots()
	const selectedId = useProject((s) => s.selectedId)
	const editing = useProject((s) => s.editingComponentId !== null)
	const place = insertPlace(roots, selectedId, editing)

	const add = (html: string) => {
		if (!place) return
		insertHtml(place.parentId, place.index, html)
		useNav.getState().setOpen([place.parentId])
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					size='xs'
					disabled={!place}
					title={
						place
							? 'Add an element'
							: 'Select an element outside of components and locked sections'
					}
				>
					<Plus />
					Add
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				{ELEMENT_PRESETS.map((p) => (
					<DropdownMenuItem key={p.id} onSelect={() => add(p.html)}>
						{p.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
