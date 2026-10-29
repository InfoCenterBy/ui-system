import { randomId, type ElementNode, type TreeNode } from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { setAttribute, setSlotContent } from '@/store/actions'
import { useDocument } from '@/store/document'

const EXTERNAL = '__external'

const textOf = (nodes: TreeNode[]): string =>
	nodes.map((n) => (n.type === 'text' ? n.text : textOf(n.children))).join('')

const fileOf = (slug: string) => `${slug}.html`

export function LinkProperties({ node }: { node: ElementNode }) {
	const site = useDocument((s) => s.doc?.site)
	const pages = useDocument((s) => s.doc?.pages)
	const list = (site?.pages ?? []).flatMap((id) => pages?.[id] ?? [])

	const href = node.attrs.href ?? ''
	const page = list.find((p) => fileOf(p.slug) === href)

	const setNewTab = (on: boolean) => {
		setAttribute(node.id, 'target', on ? '_blank' : null)
		setAttribute(node.id, 'rel', on ? 'noopener' : null)
	}

	return (
		<div className='flex flex-col gap-3'>
			<Field label='Text'>
				<Input
					value={textOf(node.children)}
					onChange={(e) =>
						setSlotContent(node.id, [
							{
								id: randomId(),
								type: 'text',
								text: e.target.value,
							},
						])
					}
				/>
			</Field>
			<Field label='Link to'>
				<NativeSelect
					value={page ? href : EXTERNAL}
					onChange={(e) =>
						setAttribute(
							node.id,
							'href',
							e.target.value === EXTERNAL
								? 'https://'
								: e.target.value
						)
					}
				>
					{list.map((p) => (
						<option key={p.id} value={fileOf(p.slug)}>
							{p.name}
						</option>
					))}
					<option value={EXTERNAL}>External URL</option>
				</NativeSelect>
			</Field>
			{!page && (
				<Field label='URL'>
					<Input
						value={href}
						placeholder='https://'
						onChange={(e) =>
							setAttribute(node.id, 'href', e.target.value)
						}
					/>
				</Field>
			)}
			<label className='flex items-center gap-2 text-sm'>
				<input
					type='checkbox'
					className='size-4 accent-primary'
					checked={node.attrs.target === '_blank'}
					onChange={(e) => setNewTab(e.target.checked)}
				/>
				Open in new tab
			</label>
		</div>
	)
}
