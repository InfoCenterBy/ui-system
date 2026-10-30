import { useCanvas } from '@/editor/canvas/canvasStore'
import { elementFor } from '@/editor/canvas/frame'
import { useProject } from '@/store/project'

export const selectAndReveal = (id: string) => {
	useProject.getState().select(id)
	const doc = useCanvas.getState().doc
	if (doc) elementFor(doc, id)?.scrollIntoView({ block: 'nearest' })
}
