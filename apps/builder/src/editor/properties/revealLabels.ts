import type { RevealType } from '@ui-system/core'
import type { Key } from '@/i18n'

export const REVEAL_LABELS: Record<RevealType, Key> = {
	fade: 'reveal.typeFade',
	'from-bottom': 'reveal.typeFromBottom',
	'from-top': 'reveal.typeFromTop',
	'from-left': 'reveal.typeFromLeft',
	'from-right': 'reveal.typeFromRight',
	zoom: 'reveal.typeZoom',
}
