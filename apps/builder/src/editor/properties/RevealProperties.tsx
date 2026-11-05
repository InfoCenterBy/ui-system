import { ListIcon, PlayIcon } from 'lucide-react'
import {
	REVEAL_DEFAULTS,
	REVEAL_MAX_MS,
	REVEAL_TYPES,
	collectReveals,
	isElement,
	isRevealType,
	readRevealConfig,
	type ElementNode,
	type RevealConfig,
} from '@ui-system/core'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { useRoots } from '@/editor/canvas/useRoots'
import { playReveal } from '@/editor/canvas/revealPlay'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { REVEAL_LABELS } from '@/editor/properties/revealLabels'
import { setReveal } from '@/store/actions'
import { useUi } from '@/store/ui'

function TypeOptions() {
	const { t } = useTranslation()
	return REVEAL_TYPES.map((type) => (
		<option key={type} value={type}>
			{t(REVEAL_LABELS[type])}
		</option>
	))
}

function MsField({
	label,
	value,
	onChange,
}: {
	label: string
	value: number
	onChange: (value: number) => void
}) {
	return (
		<Field label={label}>
			<Input
				type='number'
				min={0}
				max={REVEAL_MAX_MS}
				step={50}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
			/>
		</Field>
	)
}

// Appear-on-scroll animation of an element, or of the children of a container one by one
export function RevealProperties({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const roots = useRoots()
	const config = readRevealConfig(node.attrs)
	const total = collectReveals(roots).length
	const hasChildren = node.children.some(isElement)
	const active = config.type !== null || config.stagger !== null
	const update = (patch: Partial<RevealConfig>) =>
		setReveal(node.id, { ...config, ...patch })

	return (
		<section className='flex flex-col gap-2'>
			<h3 className='text-xs font-medium'>{t('reveal.title')}</h3>
			<Field label={t('reveal.type')}>
				<NativeSelect
					value={config.type ?? ''}
					onChange={(e) =>
						update({
							type: isRevealType(e.target.value)
								? e.target.value
								: null,
						})
					}
				>
					<option value=''>{t('reveal.none')}</option>
					<TypeOptions />
				</NativeSelect>
			</Field>
			{hasChildren && (
				<Field label={t('reveal.stagger')}>
					<NativeSelect
						value={config.stagger?.type ?? ''}
						onChange={(e) =>
							update({
								stagger: isRevealType(e.target.value)
									? {
											type: e.target.value,
											step:
												config.stagger?.step ??
												REVEAL_DEFAULTS.step,
										}
									: null,
							})
						}
					>
						<option value=''>{t('reveal.none')}</option>
						<TypeOptions />
					</NativeSelect>
				</Field>
			)}
			{config.stagger && (
				<MsField
					label={t('reveal.step')}
					value={config.stagger.step}
					onChange={(step) =>
						update({ stagger: { ...config.stagger!, step } })
					}
				/>
			)}
			{active && (
				<>
					<div className='grid grid-cols-2 gap-2'>
						<MsField
							label={t('reveal.duration')}
							value={config.duration}
							onChange={(duration) => update({ duration })}
						/>
						<MsField
							label={t('reveal.delay')}
							value={config.delay}
							onChange={(delay) => update({ delay })}
						/>
					</div>
					<div className='flex items-center justify-between gap-4 text-sm'>
						<label htmlFor='reveal-repeat'>
							{t('reveal.repeat')}
						</label>
						<Switch
							id='reveal-repeat'
							checked={config.repeat}
							onCheckedChange={(repeat) => update({ repeat })}
						/>
					</div>
					<Button
						size='sm'
						variant='outline'
						className='w-fit'
						onClick={() => {
							const doc = useCanvas.getState().doc
							if (doc) playReveal(doc, node)
						}}
					>
						<PlayIcon /> {t('reveal.play')}
					</Button>
					<p className='text-muted-foreground text-xs'>
						{t('reveal.hint')}
					</p>
				</>
			)}
			{total > 0 && (
				<Button
					size='sm'
					variant='ghost'
					className='w-fit'
					onClick={() => useUi.getState().setReveals(true)}
				>
					<ListIcon /> {t('reveal.overview', { count: total })}
				</Button>
			)}
		</section>
	)
}
