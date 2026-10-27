import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

const mix = (color, amount = 75) =>
	`color-mix(in oklab, var(--color-${color}) ${amount}%, var(--color-base-content))`

// Colors come from the active daisyUI theme
const theme = EditorView.theme({
	'&': {
		backgroundColor: 'var(--color-base-200)',
		color: 'var(--color-base-content)',
		fontSize: '13px',
		borderRadius: 'var(--radius-box)',
	},
	'&.cm-focused': { outline: 'none' },
	'.cm-scroller': {
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
		lineHeight: '1.6',
	},
	'.cm-content': { caretColor: 'var(--color-base-content)' },
	'.cm-cursor': { borderLeftColor: 'var(--color-base-content)' },
	'.cm-gutters': {
		backgroundColor: 'transparent',
		border: 'none',
		color: 'color-mix(in oklab, var(--color-base-content) 35%, transparent)',
	},
	'.cm-activeLine, .cm-activeLineGutter': {
		backgroundColor:
			'color-mix(in oklab, var(--color-base-content) 5%, transparent)',
	},
	'.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection':
		{
			backgroundColor:
				'color-mix(in oklab, var(--color-primary) 30%, transparent) !important',
		},
	'.cm-foldPlaceholder': {
		backgroundColor: 'var(--color-base-300)',
		border: 'none',
		color: 'inherit',
	},
})

const highlight = HighlightStyle.define([
	{ tag: [t.tagName, t.standard(t.tagName)], color: mix('info') },
	{ tag: t.attributeName, color: mix('warning', 65) },
	{ tag: [t.attributeValue, t.string], color: mix('success') },
	{ tag: [t.keyword, t.bool, t.null], color: mix('secondary') },
	{ tag: [t.propertyName, t.function(t.variableName)], color: mix('accent') },
	{ tag: [t.angleBracket, t.punctuation, t.bracket], opacity: '0.6' },
	{ tag: t.comment, fontStyle: 'italic', opacity: '0.55' },
])

const CodeEditor = ({ value, onChange, language = 'html', readOnly }) => {
	const hostRef = useRef(null)
	const viewRef = useRef(null)
	const onChangeRef = useRef(onChange)

	useEffect(() => {
		onChangeRef.current = onChange
	}, [onChange])

	useEffect(() => {
		const view = new EditorView({
			parent: hostRef.current,
			state: EditorState.create({
				doc: value,
				extensions: [
					basicSetup,
					theme,
					syntaxHighlighting(highlight),
					language === 'jsx' ? javascript({ jsx: true }) : html(),
					EditorView.lineWrapping,
					EditorState.readOnly.of(Boolean(readOnly)),
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							onChangeRef.current?.(update.state.doc.toString())
						}
					}),
				],
			}),
		})
		viewRef.current = view
		return () => view.destroy()
		// Created once per mount, external value changes are synced below
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [language, readOnly])

	// Push outside changes such as Reset into the editor
	useEffect(() => {
		const view = viewRef.current
		if (view && view.state.doc.toString() !== value) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: value },
			})
		}
	}, [value])

	return (
		<div
			ref={hostRef}
			className='max-h-[32rem] overflow-auto rounded-box'
		/>
	)
}

export default CodeEditor
