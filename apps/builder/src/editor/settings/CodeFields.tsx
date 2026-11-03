import type { CustomCode } from '@ui-system/core'
import { Field } from '@/editor/properties/Field'
import { useTranslation } from 'react-i18next'

const AREA =
	'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none focus-visible:ring-3'

// Two textareas for code added to the head and the end of the body
export function CodeFields({
	value,
	onChange,
}: {
	value: CustomCode | undefined
	onChange: (code: CustomCode) => void
}) {
	const { t } = useTranslation()
	const code = { head: value?.head ?? '', body: value?.body ?? '' }
	return (
		<div className='flex flex-col gap-3'>
			<Field label={t('seo.codeHead')}>
				<textarea
					rows={4}
					spellCheck={false}
					value={code.head}
					className={AREA}
					onChange={(e) =>
						onChange({ ...code, head: e.target.value })
					}
				/>
			</Field>
			<Field label={t('seo.codeBody')}>
				<textarea
					rows={4}
					spellCheck={false}
					value={code.body}
					className={AREA}
					onChange={(e) =>
						onChange({ ...code, body: e.target.value })
					}
				/>
			</Field>
			<span className='text-muted-foreground text-xs'>
				{t('seo.codeHint')}
			</span>
		</div>
	)
}
