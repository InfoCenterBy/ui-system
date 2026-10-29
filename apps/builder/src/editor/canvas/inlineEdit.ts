import { baseKeymap, toggleMark } from 'prosemirror-commands'
import { history, redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import {
	DOMParser,
	DOMSerializer,
	type MarkType,
	type Schema,
} from 'prosemirror-model'
import { EditorState, type Command } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { parseHtml, type SlotKind } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { schemaFor } from '@/editor/canvas/inlineSchema'
import { setSlotContent } from '@/store/actions'

const SAVE_DELAY = 250

let active: {
	id: string
	view: EditorView
	flush: () => boolean
	// Markup before editing, put back when nothing changed so node ids stay
	original: string
	el: HTMLElement
} | null = null

export const activeEditor = () => active

const serialize = (view: EditorView, schema: Schema) => {
	const doc = view.dom.ownerDocument
	const fragment = DOMSerializer.fromSchema(schema).serializeFragment(
		view.state.doc.content,
		{ document: doc }
	)
	const box = doc.createElement('div')
	box.append(fragment)
	return box.innerHTML
}

// Asks for a URL in the editor window and links the selection, empty input unlinks
export const promptLink: Command = (state, dispatch) => {
	const type = state.schema.marks.link as MarkType | undefined
	if (!type || state.selection.empty) return false
	const current = state.doc.rangeHasMark(
		state.selection.from,
		state.selection.to,
		type
	)
	const href = window.prompt('Link address', current ? '' : 'https://')
	if (href === null) return true
	const { from, to } = state.selection
	const tr = state.tr.removeMark(from, to, type)
	if (href.trim()) tr.addMark(from, to, type.create({ href: href.trim() }))
	dispatch?.(tr)
	return true
}

export const toggle = (name: 'strong' | 'em'): Command => {
	return (state, dispatch) => {
		const type = state.schema.marks[name]
		return type ? toggleMark(type)(state, dispatch) : false
	}
}

// Turns a slot element on the canvas into an editor until it loses focus
export const startInlineEdit = (
	el: HTMLElement,
	id: string,
	slot: SlotKind
) => {
	if (active?.id === id) return
	stopInlineEdit()
	const schema = schemaFor(slot)
	const original = el.innerHTML
	const doc = DOMParser.fromSchema(schema).parse(el.cloneNode(true) as Node)
	let timer: ReturnType<typeof setTimeout> | undefined
	let lastHtml = ''

	let changed = false
	const save = () => {
		clearTimeout(timer)
		const html = serialize(view, schema)
		if (html !== lastHtml) {
			lastHtml = html
			changed = true
			setSlotContent(id, parseHtml(html))
		}
		return changed
	}

	const finish: Command = () => {
		stopInlineEdit()
		return true
	}

	const view: EditorView = new EditorView(
		{ mount: el },
		{
			state: EditorState.create({
				doc,
				plugins: [
					history(),
					keymap({
						'Mod-z': undo,
						'Mod-y': redo,
						'Mod-Shift-z': redo,
						'Mod-b': toggle('strong'),
						'Mod-i': toggle('em'),
						'Mod-k': promptLink,
						Escape: finish,
						// Enter breaks the line in rich text and ends editing elsewhere
						Enter:
							slot === 'rich'
								? (state, dispatch) => {
										const br = state.schema.nodes.hard_break
										dispatch?.(
											state.tr.replaceSelectionWith(
												br.create()
											)
										)
										return true
									}
								: finish,
					}),
					keymap(baseKeymap),
				],
			}),
			dispatchTransaction(tr) {
				view.updateState(view.state.apply(tr))
				if (tr.docChanged) {
					clearTimeout(timer)
					timer = setTimeout(save, SAVE_DELAY)
				}
			},
			handleDOMEvents: {
				blur: () => {
					// Clicks on the toolbar keep focus in the editor
					setTimeout(() => {
						if (active?.view === view && !view.hasFocus())
							stopInlineEdit()
					})
					return false
				},
			},
		}
	)
	lastHtml = serialize(view, schema)
	active = { id, view, flush: save, original, el }
	useCanvas.getState().setEditing(id)
	view.focus()
}

export const stopInlineEdit = () => {
	if (!active) return
	const { view, flush, original, el } = active
	active = null
	const changed = flush()
	view.destroy()
	if (!changed) el.innerHTML = original
	useCanvas.getState().setEditing(null)
}
