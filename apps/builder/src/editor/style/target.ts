import { create } from 'zustand'
import {
	BREAKPOINTS,
	resolveUtility,
	type Breakpoint,
	type UtilityGroup,
} from '@ui-system/core'
import { t } from '@/i18n'

// Breakpoint the style panel writes to, '' is every screen. UI state only, never saved
export const useStyleTarget = create<{
	target: Breakpoint
	setTarget: (target: Breakpoint) => void
}>((set) => ({ target: '', setTarget: (target) => set({ target }) }))

const order = BREAKPOINTS.map((b) => b.prefix as Breakpoint)

export const minWidthOf = (bp: Breakpoint) =>
	BREAKPOINTS.find((b) => b.prefix === bp)?.min ?? 0

export const targetLabel = (bp: Breakpoint) =>
	bp === ''
		? t('style.allScreens')
		: t('style.from', {
				bp: BREAKPOINTS.find((b) => b.prefix === bp)?.label ?? bp,
			})

// Hint under the target control, warn is set when the target is invisible on the canvas
export const targetHint = (target: Breakpoint, canvasWidth: number) => {
	if (target === '') {
		return { text: t('style.hintAll'), warn: false }
	}
	const label = BREAKPOINTS.find((b) => b.prefix === target)?.label ?? target
	const hidden = minWidthOf(target) > canvasWidth
	return {
		text: hidden
			? t('style.hintHidden')
			: t('style.hintFrom', { bp: label }),
		warn: hidden,
	}
}

// Breakpoint above the target whose class wins at the canvas breakpoint, null when none does
export const overriddenAt = (
	classes: string,
	group: UtilityGroup,
	target: Breakpoint,
	canvasBp: Breakpoint
): Breakpoint | null => {
	if (order.indexOf(canvasBp) <= order.indexOf(target)) return null
	const winner = resolveUtility(classes, group, canvasBp)
	if (!winner || order.indexOf(winner.from) <= order.indexOf(target)) {
		return null
	}
	return winner.from
}
