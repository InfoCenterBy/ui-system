import { Schema, type MarkSpec } from 'prosemirror-model'
import type { SlotKind } from '@ui-system/core'

const link: MarkSpec = {
	attrs: { href: { default: '#' }, target: { default: null } },
	inclusive: false,
	parseDOM: [
		{
			tag: 'a[href]',
			getAttrs: (dom) => ({
				href: (dom as HTMLElement).getAttribute('href'),
				target: (dom as HTMLElement).getAttribute('target'),
			}),
		},
	],
	toDOM: (mark) => [
		'a',
		{
			href: mark.attrs.href,
			...(mark.attrs.target === '_blank'
				? { target: '_blank', rel: 'noopener' }
				: {}),
		},
		0,
	],
}

// Rich slots: bold, italic, links and line breaks inside one paragraph
export const richSchema = new Schema({
	nodes: {
		doc: { content: 'inline*' },
		text: { group: 'inline' },
		hard_break: {
			inline: true,
			group: 'inline',
			selectable: false,
			parseDOM: [{ tag: 'br' }],
			toDOM: () => ['br'],
		},
	},
	marks: {
		strong: {
			parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
			toDOM: () => ['strong', 0],
		},
		em: {
			parseDOM: [{ tag: 'em' }, { tag: 'i' }],
			toDOM: () => ['em', 0],
		},
		link,
	},
})

// Text and link slots: plain text only
export const plainSchema = new Schema({
	nodes: {
		doc: { content: 'text*' },
		text: {},
	},
})

export const schemaFor = (slot: SlotKind) =>
	slot === 'rich' ? richSchema : plainSchema

export const isInlineEditable = (slot: SlotKind | undefined) =>
	slot === 'text' || slot === 'rich' || slot === 'link'
