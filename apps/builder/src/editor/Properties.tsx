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
	isElement,
	sectionOf,
	walk,
	type ElementNode,
} from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { labelOf, scopeOf } from '@/editor/canvas/nodes'
import {
	CreateComponent,
	InstanceProperties,
	OverrideRow,
} from '@/editor/components/InstanceProperties'
import {
	COUNTDOWN_ATTR,
	CountdownProperties,
} from '@/editor/properties/CountdownProperties'
import {
	FooterPositionField,
	HeaderPositionField,
} from '@/editor/properties/PartialLayout'
import { CarouselProperties } from '@/editor/properties/CarouselProperties'
import { ButtonProperties } from '@/editor/properties/ButtonProperties'
import { FormProperties } from '@/editor/properties/FormProperties'
import { MenuSyncField } from '@/editor/properties/MenuSyncField'
import { ImageProperties } from '@/editor/properties/ImageProperties'
import { carouselOf, slidesOf } from '@/store/carousel'
import { OptionsProperties } from '@/editor/properties/OptionsProperties'
import { LinkProperties } from '@/editor/properties/LinkProperties'
import { PopupIdField, PopupSelect } from '@/editor/properties/PopupSelect'
import { popupKind } from '@/editor/properties/popups'
import { ClassField } from '@/editor/style/ClassField'
import { StylePanel } from '@/editor/style/StylePanel'
import { RepeatProperties } from '@/editor/properties/RepeatProperties'
import { RepeatItems } from '@/editor/properties/RepeatItems'
import { RevealProperties } from '@/editor/properties/RevealProperties'
import { PropControls } from '@/editor/components/PropControls'
import { VariantSelect } from '@/editor/properties/VariantSelect'
import { useRoots } from '@/editor/canvas/useRoots'
import {
	deleteNode,
	duplicateSection,
	fillMenuWithPages,
	isSharedPart,
	moveSection,
	setPartial,
	setSectionLocked,
} from '@/store/actions'
import { useTranslation } from 'react-i18next'
import { useDocument } from '@/store/document'
import { useCurrentPage, useProject } from '@/store/project'

function SectionActions({ id }: { id: string }) {
	const { t } = useTranslation()
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
				<ArrowUpIcon /> {t('common.up')}
			</Button>
			<Button
				size='sm'
				variant='outline'
				disabled={index === page.sections.length - 1}
				onClick={() => moveSection(id, index + 1)}
			>
				<ArrowDownIcon /> {t('common.down')}
			</Button>
			<Button
				size='sm'
				variant='outline'
				onClick={() => duplicateSection(id)}
			>
				<CopyIcon /> {t('common.duplicate')}
			</Button>
			<Button size='sm' variant='outline' onClick={() => deleteNode(id)}>
				<Trash2Icon /> {t('common.delete')}
			</Button>
		</div>
	)
}

// Shared sections are changed for the whole site, not per page
// Locked sections edit only their slots, unlocked ones every element
function LockToggle({ section }: { section: ElementNode }) {
	const { t } = useTranslation()
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
				{locked ? t('props.unlock') : t('props.lock')}
			</Button>
			<p className='text-muted-foreground text-xs'>
				{locked ? t('props.unlockHint') : t('props.lockHint')}
			</p>
		</div>
	)
}

function PartialActions({ name }: { name: 'header' | 'footer' }) {
	const { t } = useTranslation()
	return (
		<div className='flex flex-col gap-2 text-sm'>
			<p className='text-muted-foreground'>
				{name === 'header'
					? t('props.headerNote')
					: t('props.footerNote')}
			</p>
			{name === 'header' && (
				<Button
					size='sm'
					variant='outline'
					className='w-fit'
					title={t('props.fillMenuTitle')}
					onClick={fillMenuWithPages}
				>
					<ListIcon /> {t('props.fillMenu')}
				</Button>
			)}
			{name === 'header' && <MenuSyncField />}
			{name === 'header' ? (
				<HeaderPositionField />
			) : (
				<FooterPositionField />
			)}
			<Button
				size='sm'
				variant='outline'
				className='w-fit'
				onClick={() => setPartial(name, null)}
			>
				<Trash2Icon />{' '}
				{name === 'header'
					? t('props.removeHeader')
					: t('props.removeFooter')}
			</Button>
		</div>
	)
}

// Keeps the sticky style bar right under the sticky element header
function trackHeaderHeight(el: HTMLDivElement | null) {
	if (!el) return
	const set = () =>
		el.parentElement?.style.setProperty(
			'--props-head',
			`${el.offsetHeight}px`
		)
	set()
	new ResizeObserver(set).observe(el)
}

export function Properties() {
	const { t } = useTranslation()
	const selectedId = useProject((s) => s.selectedId)
	const select = useProject((s) => s.select)
	const page = useCurrentPage()
	// Header and footer are selectable too, they live outside the page
	const roots = useRoots()
	const partials = useDocument((s) => s.doc?.partials)
	const node = selectedId ? findElement(roots, selectedId) : null
	const editingId = useProject((s) => s.editingComponentId)
	useDocument((s) => s.doc?.components)
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
					{page?.name ?? t('props.title')}
				</h2>
				{page && (
					<div className='flex flex-col gap-1 p-3 text-sm'>
						<p>
							{t('props.sectionCount', {
								count: page.sections.length,
							})}
						</p>
						<p className='text-muted-foreground'>
							{t('props.selectHint')}
						</p>
					</div>
				)}
			</aside>
		)
	}

	const editing = Boolean(editingId)
	const section = editing ? null : sectionOf(roots, node.id)
	// Classes and styles only where the structure is free, never on an instance
	const free = scopeOf(roots, node.id, editing) === 'free' && !node.instance
	const ancestors = ancestorsOf(roots, node.id)
	// Sections and partial roots have their own actions, the master root stays
	const canDelete =
		scopeOf(roots, node.id, editing) === 'free' &&
		!node.section &&
		!partialName &&
		!roots.some((r) => r.id === node.id)
	const owner = node.instance ? node : ancestors.findLast((a) => a.instance)
	const topLevelOf = (list: typeof roots, id: string) =>
		list.some((r) => r.id === id)
	const topLevel = topLevelOf(roots, node.id)
	const canCreate =
		!editing &&
		!node.instance &&
		!owner &&
		!isSharedPart(partials, node.id) &&
		(topLevel || scopeOf(roots, node.id) === 'free')
	const repeatNode = node.repeat
		? node
		: ancestorsOf(roots, node.id).findLast((a) => a.repeat)
	const countdown =
		node.attrs[COUNTDOWN_ATTR] !== undefined
			? node
			: ancestors.findLast((a) => a.attrs[COUNTDOWN_ATTR] !== undefined)
	// The master root has no siblings, so it is not a repeat item there
	const carousel = free ? carouselOf(roots, node.id) : null
	// Slides have their own list, it also keeps slide ids and arrows in step
	const item =
		repeatNode &&
		!(editing && topLevelOf(roots, repeatNode.id)) &&
		!(carousel && slidesOf(carousel).includes(repeatNode))
			? repeatNode
			: undefined
	// Any picture where the structure is free, not only marked image slots
	const image =
		node.slot === 'image' || (free && node.tag.toLowerCase() === 'img')

	// A locked section is selected as a whole, its only form is configured from there
	const isForm = (n: ElementNode) => n.tag.toLowerCase() === 'form'
	const inner: ElementNode[] = []
	if (node.section) {
		walk([node], (n) => {
			if (isElement(n) && isForm(n)) inner.push(n)
		})
	}
	const form = isForm(node)
		? node
		: (ancestors.findLast(isForm) ?? (inner.length === 1 ? inner[0] : null))

	// Slot links already have the link panel
	const buttonLike =
		!node.slot && ['a', 'button'].includes(node.tag.toLowerCase())

	return (
		<aside className='flex h-full flex-col overflow-y-auto'>
			<div
				ref={trackHeaderHeight}
				className='bg-background sticky top-0 z-20 flex flex-col gap-0.5 border-b px-3 py-2'
			>
				{(owner ?? section) && (owner ?? section)?.id !== node.id && (
					<button
						type='button'
						className='text-muted-foreground hover:text-foreground w-fit text-xs'
						onClick={() => select((owner ?? section)!.id)}
					>
						{labelOf((owner ?? section)!)}
					</button>
				)}
				<h2 className='text-sm font-medium'>{labelOf(node)}</h2>
			</div>
			<div className='flex flex-col gap-4 p-3'>
				{node.instance && <InstanceProperties instance={node} />}
				{editing && <PropControls node={node} />}
				{node.section && !editing && !node.instance && (
					<LockToggle section={node} />
				)}
				{partialName && !editing && (
					<PartialActions name={partialName} />
				)}
				{node.section && !partialName && !editing && (
					<>
						{!node.instance && <VariantSelect section={node} />}
						<SectionActions id={node.id} />
					</>
				)}
				{owner && node.slot && !node.instance && (
					<OverrideRow node={node} instance={owner} />
				)}
				{image && <ImageProperties node={node} />}
				{carousel && <CarouselProperties carousel={carousel} />}
				{node.slot === 'link' && (
					<>
						<LinkProperties node={node} />
						<PopupSelect node={node} />
					</>
				)}
				{(node.slot === 'text' || node.slot === 'rich') && (
					<p className='text-muted-foreground text-sm'>
						{t('props.textHint')}
					</p>
				)}
				{countdown && (
					<CountdownProperties
						key={`countdown-${countdown.id}`}
						node={countdown}
					/>
				)}
				{item && <RepeatProperties item={item} />}
				<RepeatItems parent={node} />
				{canDelete && (
					<Button
						size='sm'
						variant='outline'
						className='w-fit'
						onClick={() => deleteNode(node.id)}
					>
						<Trash2Icon /> {t('common.delete')}
					</Button>
				)}
				{free && buttonLike && <ButtonProperties node={node} />}
				{/* Locked sections still need a form address, instances take it from the master */}
				{(free || !owner) && <FormProperties node={node} form={form} />}
				{free && <OptionsProperties node={node} />}
				{free && popupKind(node) && (
					<PopupIdField
						key={`${node.id}:${node.attrs.id ?? ''}`}
						node={node}
					/>
				)}
				{free && <ClassField node={node} />}
				{/* A locked section can still appear on scroll as a whole */}
				{(free || node.section) && !node.instance && (
					<RevealProperties key={`reveal-${node.id}`} node={node} />
				)}
				{canCreate && <CreateComponent key={node.id} node={node} />}
			</div>
			{free && <StylePanel node={node} />}
		</aside>
	)
}
