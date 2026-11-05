import { PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { propKindsFor, type ElementNode } from '@ui-system/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { labelOf } from '@/editor/canvas/nodes'
import { useTranslation } from 'react-i18next'
import { addProp, removeProp, renameProp } from '@/store/variantActions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

// Component mode: expose the selected master node as labelled instance fields
export function PropControls({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const componentId = useProject((s) => s.editingComponentId)
	const component = useDocument((s) =>
		componentId ? s.doc?.components[componentId] : undefined
	)
	if (!componentId || !component) return null
	const own = (component.props ?? []).filter((p) => p.node === node.id)
	const free = propKindsFor(node, component.root.id === node.id).filter(
		(kind) => !own.some((p) => p.kind === kind)
	)
	if (own.length === 0 && free.length === 0) return null
	return (
		<div className='flex flex-col gap-2'>
			<span className='text-xs font-medium'>
				{t('variants.propsTitle')}
			</span>
			{own.map((prop) => (
				<div key={prop.id} className='flex items-center gap-1'>
					<Input
						className='h-7 text-xs'
						value={prop.label}
						aria-label={t('variants.propLabel')}
						onChange={(e) =>
							renameProp(componentId, prop.id, e.target.value)
						}
					/>
					<span className='text-muted-foreground shrink-0 text-xs'>
						{t(`variants.kind.${prop.kind}`)}
					</span>
					<Button
						size='icon-xs'
						variant='ghost'
						title={t('variants.removeProp')}
						aria-label={t('variants.removeProp')}
						onClick={() => removeProp(componentId, prop.id)}
					>
						<XIcon />
					</Button>
				</div>
			))}
			{free.length > 0 && (
				<>
					<div className='flex flex-wrap gap-1'>
						{free.map((kind) => (
							<Button
								key={kind}
								size='xs'
								variant='outline'
								title={t('variants.expose')}
								onClick={() => {
									try {
										addProp(
											componentId,
											node.id,
											kind,
											labelOf(node)
										)
									} catch (e) {
										toast.error((e as Error).message)
									}
								}}
							>
								<PlusIcon /> {t(`variants.kind.${kind}`)}
							</Button>
						))}
					</div>
					<p className='text-muted-foreground text-xs'>
						{t('variants.propsHint')}
					</p>
				</>
			)}
		</div>
	)
}
