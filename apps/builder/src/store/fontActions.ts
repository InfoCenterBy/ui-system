import type { FontChoice, Site } from '@ui-system/core'
import { useDocument } from '@/store/document'

export type FontRole = keyof Site['fonts']

const LABELS: Record<FontRole, string> = {
	heading: 'heading font',
	body: 'body font',
}

// One undo step, null goes back to the system font
export function setFont(role: FontRole, choice: FontChoice | null) {
	useDocument.getState().edit(`Set ${LABELS[role]}`, (draft) => {
		draft.site.fonts[role] = choice
	})
}

export const sameChoice = (a: FontChoice | null, b: FontChoice | null) =>
	JSON.stringify(a) === JSON.stringify(b)

export const weightsOf = (choice: FontChoice) =>
	[...new Set(choice.files.map((f) => f.weight))].sort((a, b) => a - b)
