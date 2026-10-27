import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { classAutocomplete, preloadClassIndex } from './classAutocomplete'

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

	// &.cm-editor matches the specificity of the light base theme it replaces
	'&.cm-editor .cm-tooltip': {
		backgroundColor: 'var(--color-base-100)',
		color: 'var(--color-base-content)',
		border: '1px solid var(--color-base-300)',
		borderRadius: 'var(--radius-field)',
		boxShadow: '0 8px 24px rgb(0 0 0 / 0.25)',
	},
	'&.cm-editor .cm-tooltip-autocomplete > ul': {
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
		maxHeight: '14rem',
		borderRadius: 'inherit',
	},
	'&.cm-editor .cm-tooltip-autocomplete > ul > li': {
		padding: '2px 10px 2px 6px',
	},
	'&.cm-editor .cm-tooltip-autocomplete ul li[aria-selected]': {
		backgroundColor: 'var(--color-primary)',
		color: 'var(--color-primary-content)',
	},
	'&.cm-editor .cm-completionMatchedText': {
		textDecoration: 'none',
		fontWeight: '700',
		color: mix('primary'),
	},
	'&.cm-editor li[aria-selected] .cm-completionMatchedText': {
		color: 'inherit',
	},
	'&.cm-editor .cm-classSwatch': {
		display: 'inline-block',
		width: '0.75rem',
		height: '0.75rem',
		marginRight: '0.4rem',
		verticalAlign: '-1px',
		borderRadius: '3px',
		boxShadow:
			'inset 0 0 0 1px color-mix(in oklab, var(--color-base-content) 20%, transparent)',
	},
	'&.cm-editor .cm-tooltip.cm-completionInfo': {
		padding: '0.5rem 0.75rem',
		maxWidth: '28rem',
	},
	'&.cm-editor .cm-classInfo': {
		margin: '0',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
		fontSize: '12px',
		lineHeight: '1.5',
		whiteSpace: 'pre-wrap',
	},
	'&.cm-editor .cm-completionIcon, &.cm-editor .cm-completionDetail': {
		opacity: '0.6',
		fontStyle: 'normal',
	},

	// Search panel from Ctrl+F
	'&.cm-editor .cm-panels': {
		backgroundColor: 'var(--color-base-200)',
		color: 'var(--color-base-content)',
	},
	'&.cm-editor .cm-panels-bottom': {
		borderTop: '1px solid var(--color-base-300)',
	},
	'&.cm-editor .cm-textfield': {
		backgroundColor: 'var(--color-base-100)',
		border: '1px solid var(--color-base-300)',
		borderRadius: 'var(--radius-field)',
		color: 'inherit',
	},
	'&.cm-editor .cm-button': {
		backgroundImage: 'none',
		backgroundColor: 'var(--color-base-300)',
		border: 'none',
		borderRadius: 'var(--radius-field)',
		color: 'inherit',
	},
	'&.cm-editor .cm-searchMatch': {
		backgroundColor:
			'color-mix(in oklab, var(--color-warning) 30%, transparent)',
		outline: 'none',
	},
	'&.cm-editor .cm-searchMatch-selected': {
		backgroundColor:
			'color-mix(in oklab, var(--color-primary) 40%, transparent)',
	},
	'&.cm-editor .cm-matchingBracket, &.cm-editor .cm-nonmatchingBracket': {
		backgroundColor:
			'color-mix(in oklab, var(--color-base-content) 15%, transparent)',
		outline: 'none',
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
					language === 'html' && !readOnly ? classAutocomplete : [],
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
		// Class suggestions are ready by the time the first one is typed
		if (language === 'html' && !readOnly) preloadClassIndex()
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
