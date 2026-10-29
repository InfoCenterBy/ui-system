import { ArrowDownIcon, ArrowUpIcon, CopyIcon, Trash2Icon } from 'lucide-react'
import { findElement } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { labelOf } from '@/editor/canvas/nodes'
import { deleteNode, duplicateSection, moveSection } from '@/store/actions'
import { useCurrentPage, useProject } from '@/store/project'

function SectionActions({ id }: { id: string }) {
	const page = useCurrentPage()
	const index = page?.sections.findIndex((s) => s.id === id) ?? -1
	if (!page || index < 0) return null
	return (
		<div className='flex flex-wrap gap-1'>
			<Button
				size='sm'
				variant='outline'
				disabled={index === 0}
				onClick={() => moveSection(id, index - 1)}
			>
				<ArrowUpIcon /> Up
			</Button>
			<Button
				size='sm'
				variant='outline'
				disabled={index === page.sections.length - 1}
				onClick={() => moveSection(id, index + 1)}
			>
				<ArrowDownIcon /> Down
			</Button>
			<Button
				size='sm'
				variant='outline'
				onClick={() => duplicateSection(id)}
			>
				<CopyIcon /> Duplicate
			</Button>
			<Button size='sm' variant='outline' onClick={() => deleteNode(id)}>
				<Trash2Icon /> Delete
			</Button>
		</div>
	)
}

export function Properties() {
	const selectedId = useProject((s) => s.selectedId)
	const page = useCurrentPage()
	const node =
		selectedId && page ? findElement(page.sections, selectedId) : null

	return (
		<aside className='flex h-full flex-col'>
			<h2 className='border-b px-3 py-2 text-sm font-medium'>
				{node ? labelOf(node) : 'Properties'}
			</h2>
			{node ? (
				<div className='flex flex-col gap-3 p-3'>
					{node.section && <SectionActions id={node.id} />}
				</div>
			) : (
				<p className='text-muted-foreground p-3 text-sm'>
					Select an element
				</p>
			)}
		</aside>
	)
}
