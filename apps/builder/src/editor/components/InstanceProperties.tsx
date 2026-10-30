import { useState } from 'react'
import { ComponentIcon, PencilIcon, UnlinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { hasInstance, isOverridden, type ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { labelOf } from '@/editor/canvas/nodes'
import { overriddenIn } from '@/editor/components/instances'
import {
	createComponentFrom,
	detach,
	resetAllContent,
	resetContent,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const fail = (e: unknown) => toast.error((e as Error).message)

// Selected instance root: its component, edit, detach and reset of overrides
export function InstanceProperties({ instance }: { instance: ElementNode }) {
	const id = instance.instance?.component ?? ''
	const component = useDocument((s) => s.doc?.components[id])
	if (!component) return null
	const changed = overriddenIn(instance, component.root)
	return (
		<div className='flex flex-col gap-2 text-sm'>
			<p className='flex items-center gap-1.5 text-purple-600 dark:text-purple-400'>
				<ComponentIcon className='size-4' />
				<span className='font-medium'>{component.name}</span>
			</p>
			<p className='text-muted-foreground text-xs'>
				A copy of the component. Edit text, images and links here;
				change layout and styles in the component itself.
			</p>
			<div className='flex flex-wrap gap-1'>
				<Button
					size='sm'
					onClick={() => useProject.getState().editComponent(id)}
				>
					<PencilIcon /> Edit component
				</Button>
				<Button
					size='sm'
					variant='outline'
					title='Turn into plain elements'
					onClick={() => {
						try {
							detach(instance.id)
						} catch (e) {
							fail(e)
						}
					}}
				>
					<UnlinkIcon /> Detach
				</Button>
			</div>
			<div className='flex items-center justify-between gap-2'>
				<span className='text-muted-foreground text-xs'>
					{changed.length === 0
						? 'No overrides'
						: `${changed.length} overridden ${changed.length === 1 ? 'place' : 'places'}`}
				</span>
				{changed.length > 0 && (
					<Button
						size='xs'
						variant='outline'
						onClick={() => resetAllContent(instance.id)}
					>
						Reset all
					</Button>
				)}
			</div>
		</div>
	)
}

// Shown for a slot inside an instance that differs from the master
export function OverrideRow({
	node,
	instance,
}: {
	node: ElementNode
	instance: ElementNode
}) {
	const master = useDocument(
		(s) => s.doc?.components[instance.instance?.component ?? '']?.root
	)
	if (!master || !isOverridden(node, master)) return null
	return (
		<div className='flex items-center justify-between gap-2 rounded-md bg-purple-500/10 px-2 py-1 text-xs'>
			<span>Overridden</span>
			<Button
				size='xs'
				variant='ghost'
				onClick={() => resetContent(node.id)}
			>
				Reset
			</Button>
		</div>
	)
}

const COMPONENT_HINT =
	'Reuse this block on other pages. Editing the component updates every copy; copies change only texts, images and links.'

// Turns the selected section or element into a component
export function CreateComponent({ node }: { node: ElementNode }) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	if (hasInstance(node)) return null
	const submit = () => {
		try {
			createComponentFrom(node.id, name)
			setOpen(false)
		} catch (e) {
			fail(e)
		}
	}
	if (!open) {
		return (
			<div className='flex flex-col gap-1.5'>
				<Button
					size='sm'
					variant='outline'
					className='w-fit'
					title={COMPONENT_HINT}
					onClick={() => {
						setName(labelOf(node))
						setOpen(true)
					}}
				>
					<ComponentIcon /> Save as component
				</Button>
				<p className='text-muted-foreground text-xs'>
					{COMPONENT_HINT}
				</p>
			</div>
		)
	}
	return (
		<form
			className='flex flex-col gap-1.5'
			onSubmit={(e) => {
				e.preventDefault()
				submit()
			}}
		>
			<p className='text-muted-foreground text-xs'>
				Name the component. Editing it updates every copy; copies change
				only texts, images and links.
			</p>
			<Input
				autoFocus
				value={name}
				aria-label='Component name'
				placeholder='Component name'
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						e.stopPropagation()
						setOpen(false)
					}
				}}
			/>
			<div className='flex gap-1'>
				<Button size='xs' type='submit' disabled={!name.trim()}>
					Save
				</Button>
				<Button
					size='xs'
					type='button'
					variant='ghost'
					onClick={() => setOpen(false)}
				>
					Cancel
				</Button>
			</div>
		</form>
	)
}
