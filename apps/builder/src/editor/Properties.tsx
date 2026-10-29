import {
	ArrowDownIcon,
	ArrowUpIcon,
	CopyIcon,
	ListIcon,
	LockIcon,
	LockOpenIcon,
	Trash2Icon,
} from 'lucide-react'
import {
	ancestorsOf,
	findElement,
	sectionOf,
	type ElementNode,
} from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { labelOf } from '@/editor/canvas/nodes'
import { ImageProperties } from '@/editor/properties/ImageProperties'
import { LinkProperties } from '@/editor/properties/LinkProperties'
import { RepeatProperties } from '@/editor/properties/RepeatProperties'
import { VariantSelect } from '@/editor/properties/VariantSelect'
import { useRoots } from '@/editor/canvas/useRoots'
import {
	deleteNode,
	duplicateSection,
	fillMenuWithPages,
	moveSection,
	setPartial,
	setSectionLocked,
} from '@/store/actions'
import { useDocument } from '@/store/document'
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

// Shared sections are changed for the whole site, not per page
// Locked sections edit only their slots, unlocked ones every element
function LockToggle({ section }: { section: ElementNode }) {
	const locked = section.section?.locked ?? true
	return (
		<div className='flex flex-col gap-1.5 text-sm'>
			<Button
				size='sm'
				variant={locked ? 'outline' : 'secondary'}
				className='w-fit'
				onClick={() => setSectionLocked(section.id, !locked)}
			>
				{locked ? <LockOpenIcon /> : <LockIcon />}
				{locked ? 'Unlock structure' : 'Lock structure'}
			</Button>
			<p className='text-muted-foreground text-xs'>
				{locked
					? 'Unlock to select any element, change its classes and move it around.'
					: 'Every element is editable. Lock again to keep the layout safe.'}
			</p>
		</div>
	)
}

function PartialActions({ name }: { name: 'header' | 'footer' }) {
	return (
		<div className='flex flex-col gap-2 text-sm'>
			<p className='text-muted-foreground'>
				Shared {name}: changes appear on every page. A page can hide it
				in its settings.
			</p>
			{name === 'header' && (
				<Button
					size='sm'
					variant='outline'
					className='w-fit'
					title='Replace the menu items with links to the site pages'
					onClick={fillMenuWithPages}
				>
					<ListIcon /> Fill menu with pages
				</Button>
			)}
			<Button
				size='sm'
				variant='outline'
				className='w-fit'
				onClick={() => setPartial(name, null)}
			>
				<Trash2Icon /> Remove {name}
			</Button>
		</div>
	)
}

export function Properties() {
	const selectedId = useProject((s) => s.selectedId)
	const select = useProject((s) => s.select)
	const page = useCurrentPage()
	// Header and footer are selectable too, they live outside the page
	const roots = useRoots()
	const partials = useDocument((s) => s.doc?.partials)
	const node = selectedId ? findElement(roots, selectedId) : null
	const partialName =
		node && node === partials?.header
			? 'header'
			: node && node === partials?.footer
				? 'footer'
				: null

	if (!page || !node) {
		return (
			<aside className='flex h-full flex-col'>
				<h2 className='border-b px-3 py-2 text-sm font-medium'>
					{page?.name ?? 'Properties'}
				</h2>
				{page && (
					<div className='flex flex-col gap-1 p-3 text-sm'>
						<p>
							{page.sections.length}{' '}
							{page.sections.length === 1
								? 'section'
								: 'sections'}
						</p>
						<p className='text-muted-foreground'>
							Select an element on the canvas to edit it
						</p>
					</div>
				)}
			</aside>
		)
	}

	const section = sectionOf(roots, node.id)
	const item = node.repeat
		? node
		: ancestorsOf(roots, node.id).findLast((a) => a.repeat)

	return (
		<aside className='flex h-full flex-col overflow-y-auto'>
			<div className='flex flex-col gap-0.5 border-b px-3 py-2'>
				{section && section.id !== node.id && (
					<button
						type='button'
						className='text-muted-foreground hover:text-foreground w-fit text-xs'
						onClick={() => select(section.id)}
					>
						{labelOf(section)}
					</button>
				)}
				<h2 className='text-sm font-medium'>{labelOf(node)}</h2>
			</div>
			<div className='flex flex-col gap-4 p-3'>
				{node.section && <LockToggle section={node} />}
				{partialName && <PartialActions name={partialName} />}
				{node.section && !partialName && (
					<>
						<VariantSelect section={node} />
						<SectionActions id={node.id} />
					</>
				)}
				{node.slot === 'image' && <ImageProperties node={node} />}
				{node.slot === 'link' && <LinkProperties node={node} />}
				{(node.slot === 'text' || node.slot === 'rich') && (
					<p className='text-muted-foreground text-sm'>
						Double-click the text on the canvas to edit it
					</p>
				)}
				{item && <RepeatProperties item={item} />}
			</div>
		</aside>
	)
}
