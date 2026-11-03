import {
	FIELD_TYPES,
	inputType,
	isElement,
	isFormField,
	walk,
	type ElementNode,
} from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { Field, NativeSelect } from '@/editor/properties/Field'
import { setAttribute } from '@/store/actions'
import { useTranslation } from 'react-i18next'

const MULTIPART = 'multipart/form-data'
const TOGGLES = ['checkbox', 'radio']

const hasFileField = (form: ElementNode) => {
	let found = false
	walk([form], (node) => {
		if (isElement(node) && node.attrs.type?.toLowerCase() === 'file')
			found = true
	})
	return found
}

const Toggle = ({
	label,
	checked,
	onChange,
}: {
	label: string
	checked: boolean
	onChange: (on: boolean) => void
}) => (
	<label className='flex items-center gap-2 text-sm'>
		<input
			type='checkbox'
			className='size-4 accent-primary'
			checked={checked}
			onChange={(e) => onChange(e.target.checked)}
		/>
		{label}
	</label>
)

// Where the form is sent: classic HTML attributes, the handler is set up on the Bitrix side
export function FormSettings({ form }: { form: ElementNode }) {
	const { t } = useTranslation()
	const method = (form.attrs.method ?? 'get').toLowerCase()
	const enctype = form.attrs.enctype ?? ''
	const file = hasFileField(form)
	return (
		<div className='flex flex-col gap-3'>
			<h3 className='text-sm font-medium'>{t('form.title')}</h3>
			<Field label={t('form.action')}>
				<Input
					value={form.attrs.action ?? ''}
					placeholder='/contacts/send.php'
					onChange={(e) =>
						setAttribute(form.id, 'action', e.target.value)
					}
				/>
				<span className='text-muted-foreground text-xs'>
					{t('form.actionHint')}
				</span>
			</Field>
			<Field label={t('form.method')}>
				<NativeSelect
					value={method}
					onChange={(e) =>
						setAttribute(
							form.id,
							'method',
							e.target.value === 'get' ? null : e.target.value
						)
					}
				>
					<option value='get'>GET</option>
					<option value='post'>POST</option>
					{method === 'dialog' && (
						<option value='dialog'>dialog</option>
					)}
				</NativeSelect>
			</Field>
			<Field label={t('form.encoding')}>
				<NativeSelect
					value={enctype === MULTIPART ? MULTIPART : ''}
					onChange={(e) =>
						setAttribute(form.id, 'enctype', e.target.value || null)
					}
				>
					<option value=''>{t('form.encDefault')}</option>
					<option value={MULTIPART}>{t('form.encMultipart')}</option>
				</NativeSelect>
				{file && enctype !== MULTIPART && (
					<span className='text-xs text-amber-600'>
						{t('form.encHint')}
					</span>
				)}
			</Field>
			<Field label={t('form.target')}>
				<NativeSelect
					value={form.attrs.target === '_blank' ? '_blank' : ''}
					onChange={(e) =>
						setAttribute(form.id, 'target', e.target.value || null)
					}
				>
					<option value=''>{t('form.targetSame')}</option>
					<option value='_blank'>{t('form.targetNew')}</option>
				</NativeSelect>
			</Field>
		</div>
	)
}

// Name, type and rules of one input, select or textarea
export function FieldSettings({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const isInput = node.tag.toLowerCase() === 'input'
	const type = inputType(node)
	const toggle = isInput && TOGGLES.includes(type)
	const name = node.attrs.name ?? ''
	return (
		<div className='flex flex-col gap-3'>
			<h3 className='text-sm font-medium'>{t('form.field')}</h3>
			<Field label={t('form.name')}>
				<Input
					value={name}
					aria-invalid={!name}
					onChange={(e) =>
						setAttribute(
							node.id,
							'name',
							e.target.value.replace(/\s+/g, '_')
						)
					}
				/>
				<span
					className={
						name
							? 'text-muted-foreground text-xs'
							: 'text-xs text-amber-600'
					}
				>
					{t('form.nameHint')}
				</span>
			</Field>
			{isInput && (
				<Field label={t('form.type')}>
					<NativeSelect
						value={type}
						onChange={(e) =>
							setAttribute(node.id, 'type', e.target.value)
						}
					>
						{(FIELD_TYPES.includes(type)
							? FIELD_TYPES
							: [...FIELD_TYPES, type]
						).map((value) => (
							<option key={value} value={value}>
								{value}
							</option>
						))}
					</NativeSelect>
				</Field>
			)}
			{!toggle && type !== 'file' && type !== 'hidden' && (
				<Field label={t('form.placeholder')}>
					<Input
						value={node.attrs.placeholder ?? ''}
						onChange={(e) =>
							setAttribute(
								node.id,
								'placeholder',
								e.target.value || null
							)
						}
					/>
				</Field>
			)}
			{toggle && (
				<Field label={t('form.value')}>
					<Input
						value={node.attrs.value ?? ''}
						onChange={(e) =>
							setAttribute(
								node.id,
								'value',
								e.target.value || null
							)
						}
					/>
					<span className='text-muted-foreground text-xs'>
						{t('form.valueHint')}
					</span>
				</Field>
			)}
			{type !== 'hidden' && (
				<Toggle
					label={t('form.required')}
					checked={'required' in node.attrs}
					onChange={(on) =>
						setAttribute(node.id, 'required', on ? '' : null)
					}
				/>
			)}
		</div>
	)
}

// Text of an input that is a button, like <input type=submit value=Send>
export function InputButtonText({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	return (
		<Field label={t('linkable.text')}>
			<Input
				value={node.attrs.value ?? ''}
				onChange={(e) => setAttribute(node.id, 'value', e.target.value)}
			/>
		</Field>
	)
}

// What the panel shows for the selection: its form, and the field or the submit input itself
export function FormProperties({
	node,
	form,
}: {
	node: ElementNode
	form: ElementNode | null
}) {
	const tag = node.tag.toLowerCase()
	const field = isFormField(node)
	const inputButton =
		tag === 'input' &&
		['submit', 'button', 'reset'].includes(inputType(node))
	if (!form && !field && !inputButton) return null
	return (
		<div className='flex flex-col gap-4'>
			{field && <FieldSettings node={node} />}
			{inputButton && <InputButtonText node={node} />}
			{form && <FormSettings form={form} />}
		</div>
	)
}
