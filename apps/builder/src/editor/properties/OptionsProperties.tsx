import type { ElementNode } from '@ui-system/core'
import {
	currentOption,
	optionsFor,
	setOption,
	type ComponentOption,
} from '@ui-system/blocks'
import { useTranslation } from 'react-i18next'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { setClasses } from '@/store/actions'

// "btn-primary" shows as "primary", "text-primary" as "primary"
const shortName = (value: string, component: string) => {
	const prefix = value.startsWith(`${component}-`)
		? component
		: value.slice(0, value.indexOf('-'))
	return value.slice(prefix.length + 1)
}

function OptionField({
	node,
	component,
	option,
}: {
	node: ElementNode
	component: string
	option: ComponentOption
}) {
	const { t } = useTranslation()
	const current = currentOption(node.classes, option)
	const toggle = option.allowNone && option.values.length === 1
	return (
		<Field label={t(`options.${option.id}` as 'options.color')}>
			<NativeSelect
				value={current ?? ''}
				onChange={(e) =>
					setClasses(
						node.id,
						setOption(node.classes, option, e.target.value || null)
					)
				}
			>
				{toggle ? (
					<>
						<option value=''>{t('options.off')}</option>
						<option value={option.values[0]}>
							{t('options.on')}
						</option>
					</>
				) : (
					<>
						<option value=''>—</option>
						{option.values.map((v) => (
							<option key={v} value={v}>
								{shortName(v, component)}
							</option>
						))}
					</>
				)}
			</NativeSelect>
		</Field>
	)
}

export function OptionsProperties({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const components = optionsFor(node.classes)
	if (components.length === 0) return null
	return (
		<section className='flex flex-col gap-2'>
			<h3 className='text-xs font-medium'>{t('options.title')}</h3>
			{components.map((c) => (
				<div key={c.component} className='flex flex-col gap-2'>
					{components.length > 1 && (
						<span className='text-muted-foreground font-mono text-xs'>
							{c.component}
						</span>
					)}
					{c.options.map((o) => (
						<OptionField
							key={o.id}
							node={node}
							component={c.component}
							option={o}
						/>
					))}
				</div>
			))}
		</section>
	)
}
