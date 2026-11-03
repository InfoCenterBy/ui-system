import type { ElementNode } from '@ui-system/core'
import { useRoots } from '@/editor/canvas/useRoots'
import { Field, NativeSelect } from '@/editor/properties/Field'
import {
	listPopups,
	popupAttrs,
	popupFor,
	popupTitle,
	suggestPopupId,
} from '@/editor/properties/popups'
import { linkPopup } from '@/store/actions'
import { useTranslation } from 'react-i18next'

const NONE = ''
const UNNAMED = 'node:'

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
