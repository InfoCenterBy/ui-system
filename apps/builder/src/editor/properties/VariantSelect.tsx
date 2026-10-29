import type { ElementNode } from '@ui-system/core'
import { getSectionPreset, sectionPresets } from '@ui-system/blocks/sections'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { switchVariant } from '@/store/actions'

export function VariantSelect({ section }: { section: ElementNode }) {
	const current = getSectionPreset(section.section?.preset ?? '')
	if (!current?.group) return null
	const variants = sectionPresets.filter((p) => p.group === current.group)
	if (variants.length < 2) return null
	return (
		<Field label='Variant'>
			<NativeSelect
				value={current.id}
				onChange={(e) => switchVariant(section.id, e.target.value)}
			>
				{variants.map((p) => (
					<option key={p.id} value={p.id}>
						{p.name}
					</option>
				))}
			</NativeSelect>
		</Field>
	)
}
