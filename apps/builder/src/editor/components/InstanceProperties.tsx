import { useState } from 'react'
import { ComponentIcon, PencilIcon, UnlinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
	hasInstance,
	isElement,
	isOverridden,
	masterNodeOf,
	randomId,
	walk,
	type Component,
	type ComponentProp,
	type ElementNode,
} from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { labelOf } from '@/editor/canvas/nodes'
import { overriddenIn } from '@/editor/components/instances'
import {
	createComponentFrom,
	detach,
	resetAllContent,
	resetContent,
	setAttribute,
	setImageAlt,
	setSlotContent,
} from '@/store/actions'
import { setInstanceHidden, setInstanceVariant } from '@/store/variantActions'
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
			{(component.variants?.length ?? 0) > 0 && (
				<Field label={t('variants.instance')}>
					<NativeSelect
						value={instance.instance?.variant ?? ''}
						onChange={(e) =>
							setInstanceVariant(
								instance.id,
								e.target.value || null
							)
						}
					>
						<option value=''>{t('variants.base')}</option>
						{component.variants?.map((v) => (
							<option key={v.id} value={v.id}>
								{v.name}
							</option>
						))}
					</NativeSelect>
				</Field>
			)}
			<PropFields instance={instance} component={component} />
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

const textOf = (node: ElementNode): string =>
	node.children.map((c) => (isElement(c) ? textOf(c) : c.text)).join('')

const nodeByRef = (instance: ElementNode, ref: string) => {
	let found: ElementNode | undefined
	walk([instance], (n) => {
		if (!found && isElement(n) && n.ref === ref) found = n
	})
	return found
}

// One labelled field of an instance, for a property of the component
function PropField({
	prop,
	node,
	component,
}: {
	prop: ComponentProp
	node: ElementNode
	component: Component
}) {
	const { t } = useTranslation()
	const changed = isOverridden(node, component.root)
	let field
	if (prop.kind === 'text') {
		field = (
			<Input
				value={textOf(node)}
				onChange={(e) =>
					setSlotContent(node.id, [
						{ id: randomId(), type: 'text', text: e.target.value },
					])
				}
			/>
		)
	} else if (prop.kind === 'image') {
		field = (
			<div className='flex flex-col gap-1'>
				<Input
					value={node.attrs.src ?? ''}
					aria-label={t('variants.imageUrl')}
					placeholder={t('variants.imageUrl')}
					onChange={(e) =>
						setAttribute(node.id, 'src', e.target.value)
					}
				/>
				<Input
					value={node.attrs.alt ?? ''}
					aria-label={t('variants.imageAlt')}
					placeholder={t('variants.imageAlt')}
					onChange={(e) => setImageAlt(node.id, e.target.value)}
				/>
			</div>
		)
	} else {
		field = (
			<Input
				value={node.attrs.href ?? ''}
				placeholder={t('variants.linkUrl')}
				onChange={(e) => setAttribute(node.id, 'href', e.target.value)}
			/>
		)
	}
	return (
		<div className='flex flex-col gap-1'>
			<div className='flex items-center justify-between gap-2'>
				<span className='text-muted-foreground text-xs'>
					{prop.label}
				</span>
				{changed && (
					<Button
						size='xs'
						variant='ghost'
						onClick={() => resetContent(node.id)}
					>
						{t('common.reset')}
					</Button>
				)}
			</div>
			{field}
		</div>
	)
}

// Labelled fields first: the properties the author exposed in the component
function PropFields({
	instance,
	component,
}: {
	instance: ElementNode
	component: Component
}) {
	const { t } = useTranslation()
	const props = (component.props ?? []).filter((p) =>
		masterNodeOf(component.root, p.node)
	)
	if (props.length === 0) return null
	return (
		<div className='flex flex-col gap-2'>
			<span className='text-xs font-medium'>
				{t('variants.properties')}
			</span>
			{props.map((prop) => {
				if (prop.kind === 'visibility') {
					const shown = !instance.instance?.hidden?.includes(
						prop.node
					)
					return (
						<label
							key={prop.id}
							className='flex items-center justify-between gap-2 text-sm'
						>
							<span>{prop.label}</span>
							<Switch
								checked={shown}
								onCheckedChange={(on) =>
									setInstanceHidden(
										instance.id,
										prop.node,
										!on
									)
								}
							/>
						</label>
					)
				}
				const node = nodeByRef(instance, prop.node)
				if (!node) {
					return (
						<p
							key={prop.id}
							className='text-muted-foreground text-xs'
						>
							{prop.label}: {t('variants.missing')}
						</p>
					)
				}
				return (
					<PropField
						key={prop.id}
						prop={prop}
						node={node}
						component={component}
					/>
				)
			})}
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
