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
import { useTranslation } from 'react-i18next'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const fail = (e: unknown) => toast.error((e as Error).message)

// Selected instance root: its component, edit, detach and reset of overrides
export function InstanceProperties({ instance }: { instance: ElementNode }) {
	const { t } = useTranslation()
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
				{t('instance.note')}
			</p>
			<div className='flex flex-wrap gap-1'>
				<Button
					size='sm'
					onClick={() => useProject.getState().editComponent(id)}
				>
					<PencilIcon /> {t('row.editComponent')}
				</Button>
				<Button
					size='sm'
					variant='outline'
					title={t('instance.detachTitle')}
					onClick={() => {
						try {
							detach(instance.id)
						} catch (e) {
							fail(e)
						}
					}}
				>
					<UnlinkIcon /> {t('row.detach')}
				</Button>
			</div>
			<div className='flex items-center justify-between gap-2'>
				<span className='text-muted-foreground text-xs'>
					{changed.length === 0
						? t('instance.noOverrides')
						: t('instance.overrides', { count: changed.length })}
				</span>
				{changed.length > 0 && (
					<Button
						size='xs'
						variant='outline'
						onClick={() => resetAllContent(instance.id)}
					>
						{t('instance.resetAll')}
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
	const { t } = useTranslation()
	const master = useDocument(
		(s) => s.doc?.components[instance.instance?.component ?? '']?.root
	)
	if (!master || !isOverridden(node, master)) return null
	return (
		<div className='flex items-center justify-between gap-2 rounded-md bg-purple-500/10 px-2 py-1 text-xs'>
			<span>{t('instance.overridden')}</span>
			<Button
				size='xs'
				variant='ghost'
				onClick={() => resetContent(node.id)}
			>
				{t('common.reset')}
			</Button>
		</div>
	)
}

// Turns the selected section or element into a component
export function CreateComponent({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
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
					title={t('component.hint')}
					onClick={() => {
						setName(labelOf(node))
						setOpen(true)
					}}
				>
					<ComponentIcon /> {t('component.save')}
				</Button>
				<p className='text-muted-foreground text-xs'>
					{t('component.hint')}
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
				{t('component.nameHint')}
			</p>
			<Input
				autoFocus
				value={name}
				aria-label={t('components.name')}
				placeholder={t('components.name')}
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
					{t('common.save')}
				</Button>
				<Button
					size='xs'
					type='button'
					variant='ghost'
					onClick={() => setOpen(false)}
				>
					{t('common.cancel')}
				</Button>
			</div>
		</form>
	)
}
