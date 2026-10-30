import type { ElementNode } from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { Field } from '@/editor/properties/Field'
import { setAttribute } from '@/store/actions'

export const COUNTDOWN_ATTR = 'data-countdown-to'

// Date the countdown runs to, the exported page counts the time left
export function CountdownProperties({ node }: { node: ElementNode }) {
	return (
		<div className='flex flex-col gap-1.5'>
			<Field label='Countdown to'>
				<Input
					type='datetime-local'
					value={node.attrs[COUNTDOWN_ATTR] ?? ''}
					onChange={(e) =>
						setAttribute(node.id, COUNTDOWN_ATTR, e.target.value)
					}
				/>
			</Field>
			<p className='text-muted-foreground text-xs'>
				Numbers stay still in the editor and tick on the exported page.
			</p>
		</div>
	)
}
