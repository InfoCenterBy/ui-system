import { useEffect } from 'react'
import { CopyIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { t as tr } from '@/i18n'
import {
	addVariant,
	deleteVariant,
	renameVariant,
	variantUsage,
} from '@/store/variantActions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const fail = (e: unknown) => toast.error((e as Error).message)

// Variant switcher under the banner: style edits go to the chosen variant
export function VariantBar() {
	const { t } = useTranslation()
	const componentId = useProject((s) => s.editingComponentId)
	const activeId = useProject((s) => s.editingVariantId)
	const setActive = useProject((s) => s.setEditingVariant)
	const component = useDocument((s) =>
		componentId ? s.doc?.components[componentId] : undefined
	)
	const variants = component?.variants ?? []
	const active = variants.find((v) => v.id === activeId)

	// The variant can vanish through undo
	useEffect(() => {
		if (activeId && !active) setActive(null)
	}, [activeId, active, setActive])

	if (!componentId || !component) return null

	const create = (copyFrom?: string) => {
		try {
			const name = copyFrom
				? `${active?.name ?? ''} ${variants.length + 1}`
				: tr('variants.newName', { n: variants.length + 1 })
			setActive(addVariant(componentId, name, copyFrom))
		} catch (e) {
			fail(e)
		}
	}

	const remove = () => {
		if (!active) return
		const doc = useDocument.getState().doc
		const usage = doc
			? variantUsage(doc, componentId, active.id)
			: { count: 0, places: [] }
		const message =
			usage.count === 0
				? t('variants.confirmDeleteUnused', { name: active.name })
				: t('variants.confirmDelete', {
						name: active.name,
						count: usage.count,
						places: usage.places.join(', '),
					})
		if (!window.confirm(message)) return
		try {
			deleteVariant(componentId, active.id)
		} catch (e) {
			fail(e)
		}
	}

	const chip = (id: string | null, label: string) => (
		<Button
			key={id ?? 'base'}
			size='xs'
			variant={id === (active?.id ?? null) ? 'default' : 'outline'}
			onClick={() => setActive(id)}
		>
			{label}
		</Button>
	)

	return (
		<div
			className={cn(
				'flex shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-1.5 text-xs',
				active && 'bg-purple-500/10'
			)}
		>
			<span className='text-muted-foreground'>{t('variants.bar')}</span>
			{chip(null, t('variants.base'))}
			{variants.map((v) => chip(v.id, v.name))}
			<Button
				size='icon-xs'
				variant='ghost'
				title={t('variants.add')}
				aria-label={t('variants.add')}
				onClick={() => create()}
			>
				<PlusIcon />
			</Button>
			{active && (
				<>
					<Input
						key={`${active.id}:${active.name}`}
						className='h-6 w-36 text-xs'
						defaultValue={active.name}
						aria-label={t('variants.name')}
						onBlur={(e) => {
							const next = e.target.value.trim()
							if (!next || next === active.name) return
							try {
								renameVariant(componentId, active.id, next)
							} catch (err) {
								fail(err)
							}
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') e.currentTarget.blur()
						}}
					/>
					<Button
						size='icon-xs'
						variant='ghost'
						title={t('variants.duplicate')}
						aria-label={t('variants.duplicate')}
						onClick={() => create(active.id)}
					>
						<CopyIcon />
					</Button>
					<Button
						size='icon-xs'
						variant='ghost'
						title={t('variants.delete')}
						aria-label={t('variants.delete')}
						onClick={remove}
					>
						<Trash2Icon />
					</Button>
				</>
			)}
			<span className='text-muted-foreground ml-auto'>
				{active ? t('variants.hint') : t('variants.baseHint')}
			</span>
		</div>
	)
}
