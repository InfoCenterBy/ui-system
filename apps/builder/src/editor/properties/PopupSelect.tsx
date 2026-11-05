import { useState } from 'react'
import type { ElementNode } from '@ui-system/core'
import { Input } from '@/components/ui/input'
import { useRoots } from '@/editor/canvas/useRoots'
import { Field, NativeSelect } from '@/editor/properties/Field'
import {
	isValidPopupId,
	listPopups,
	popupIdTaken,
	popupAttrs,
	popupFor,
	popupTitle,
	suggestPopupId,
} from '@/editor/properties/popups'
import { linkPopup, renamePopupId } from '@/store/actions'
import { useTranslation } from 'react-i18next'

const NONE = ''
const UNNAMED = 'node:'

// The id of a modal or popover, buttons and links that open it follow a rename
export function PopupIdField({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const roots = useRoots()
	const current = node.attrs.id ?? ''
	const [draft, setDraft] = useState(current)
	const value = draft.trim()
	const error =
		value === current || value === ''
			? null
			: !isValidPopupId(value)
				? t('popup.idInvalid')
				: popupIdTaken(roots, value, node.id)
					? t('popup.idTaken')
					: null
	const commit = () => {
		if (error || value === '' || value === current) {
			setDraft(error || value === '' ? current : value)
			return
		}
		renamePopupId(node.id, value)
	}
	return (
		<Field label={t('popup.id')}>
			<Input
				value={draft}
				aria-invalid={error ? true : undefined}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur()
				}}
			/>
			{error ? (
				<p className='text-destructive text-xs'>{error}</p>
			) : (
				<p className='text-muted-foreground text-xs'>
					{t('popup.idHint')}
				</p>
			)}
		</Field>
	)
}

// "Opens popup" of a button or link: the modals and popovers of the page, header and footer
export function PopupSelect({ node }: { node: ElementNode }) {
	const { t } = useTranslation()
	const roots = useRoots()
	const popups = listPopups(roots).filter((p) => p.node.id !== node.id)
	if (popups.length === 0) return null
	const current = popupFor(node, popups)

	const change = (value: string) => {
		if (value === NONE) {
			if (current) linkPopup(node.id, popupAttrs(node, null, ''))
			return
		}
		const unnamed = value.startsWith(UNNAMED)
		const popup = popups.find((p) =>
			unnamed ? p.node.id === value.slice(UNNAMED.length) : p.id === value
		)
		if (!popup) return
		const id = unnamed ? suggestPopupId(roots, popup) : popup.id
		linkPopup(
			node.id,
			popupAttrs(node, popup.kind, id),
			unnamed ? { nodeId: popup.node.id, id } : undefined
		)
	}

	return (
		<Field label={t('popup.opens')}>
			<NativeSelect
				value={current?.id ?? NONE}
				onChange={(e) => change(e.target.value)}
			>
				<option value={NONE}>{t('popup.none')}</option>
				{popups.map((p) => (
					<option
						key={p.node.id}
						value={p.id || `${UNNAMED}${p.node.id}`}
					>
						{t(
							p.kind === 'modal' ? 'popup.modal' : 'popup.popover'
						)}{' '}
						{popupTitle(p)}
						{p.id ? '' : ` ${t('popup.noId')}`}
					</option>
				))}
			</NativeSelect>
		</Field>
	)
}
