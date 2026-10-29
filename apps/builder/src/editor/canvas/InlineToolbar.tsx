import { BoldIcon, ItalicIcon, LinkIcon } from 'lucide-react'
import type { Command } from 'prosemirror-state'
import { findElement } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import { activeEditor, promptLink, toggle } from '@/editor/canvas/inlineEdit'
import { useRoots } from '@/editor/canvas/useRoots'

const BUTTONS = [
	{ label: 'Bold (Ctrl+B)', icon: BoldIcon, command: toggle('strong') },
	{ label: 'Italic (Ctrl+I)', icon: ItalicIcon, command: toggle('em') },
	{ label: 'Link (Ctrl+K)', icon: LinkIcon, command: promptLink },
]

const run = (command: Command) => {
	const view = activeEditor()?.view
	if (!view) return
	command(view.state, view.dispatch, view)
	view.focus()
}

// Formatting buttons above a rich text slot while it is edited
export function InlineToolbar({ scale }: { scale: number }) {
	const doc = useCanvas((s) => s.doc)
	const editingId = useCanvas((s) => s.editingId)
	const roots = useRoots()
	const node = editingId ? findElement(roots, editingId) : null
	const el = doc && editingId ? elementFor(doc, editingId) : null
	if (!node || node.slot !== 'rich' || !el) return null
	const rect = el.getBoundingClientRect()

	return (
		<div
			className='bg-popover absolute flex gap-0.5 rounded-md border p-0.5 shadow-md'
			style={{
				top: Math.max(0, rect.top),
				left: rect.left,
				transform: `translateY(-100%) scale(${1 / scale})`,
				transformOrigin: 'bottom left',
			}}
			// Keeps focus in the text so the editor stays open
			onMouseDown={(e) => e.preventDefault()}
		>
			{BUTTONS.map(({ label, icon: Icon, command }) => (
				<button
					key={label}
					type='button'
					title={label}
					aria-label={label}
					className='rounded p-1.5 hover:bg-accent'
					onClick={() => run(command)}
				>
					<Icon className='size-4' />
				</button>
			))}
		</div>
	)
}
