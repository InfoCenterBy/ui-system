import {
	ancestorsOf,
	detachInstance,
	findElement,
	locate,
	randomId,
	type ElementNode,
} from '@ui-system/core'
import { toast } from 'sonner'
import { scopeOf } from '@/editor/canvas/nodes'
import { useNav } from '@/editor/navigator/navState'
import { t } from '@/i18n'
import { deleteSelected, duplicateSection } from '@/store/actions'
import {
	freshCopy,
	parseClip,
	resolvePaste,
	serializeClip,
	type ClipKind,
	type ClipPayload,
} from '@/store/clipboard'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

// Fallback when the system clipboard cannot be read or written
let memory: ClipPayload | null = null

// What the canvas draws now, like useRoots but outside React
const currentRoots = (): ElementNode[] => {
	const { doc } = useDocument.getState()
	const { currentPageId, editingComponentId } = useProject.getState()
	if (!doc) return []
	if (editingComponentId) {
		const master = doc.components[editingComponentId]?.root
		return master ? [master] : []
	}
	const page = currentPageId ? doc.pages[currentPageId] : undefined
	if (!page) return []
	const { header, footer } = doc.partials
	return [
		...(page.showHeader && header ? [header] : []),
		...page.sections,
		...(page.showFooter && footer ? [footer] : []),
	]
}

const pageSections = () => {
	const { doc } = useDocument.getState()
	const id = useProject.getState().currentPageId
	return (id && doc?.pages[id]?.sections) || []
}

const hasComponent = (id: string) =>
	Boolean(useDocument.getState().doc?.components[id])

// A page section or a partial root
const isSectionRoot = (id: string) => {
	const { header, footer } = useDocument.getState().doc?.partials ?? {}
	return (
		pageSections().some((s) => s.id === id) ||
		header?.id === id ||
		footer?.id === id
	)
}

const selectedNode = () => {
	const id = useProject.getState().selectedId
	return id ? findElement(currentRoots(), id) : null
}

// A copy of the selection ready for the clipboard
const clipOfSelection = (): ClipPayload | null => {
	const node = selectedNode()
	if (!node) return null
	const roots = currentRoots()
	const kind: ClipKind = isSectionRoot(node.id) ? 'section' : 'element'
	// Parts of an instance leave the component behind
	const inInstance =
		!node.instance && ancestorsOf(roots, node.id).some((a) => a.instance)
	const copy = structuredClone(
		inInstance ? detachInstance(node) : (node as ElementNode)
	)
	return { uiBuilder: 1, kind, nodes: [copy] }
}

// Fills the clipboard event, or the system clipboard when there is no event
export const copySelected = (data?: DataTransfer | null) => {
	const clip = clipOfSelection()
	if (!clip) {
		toast.error(t('speed.nothingToCopy'))
		return false
	}
	memory = clip
	const text = serializeClip(clip.kind, clip.nodes)
	if (data) data.setData('text/plain', text)
	else void navigator.clipboard?.writeText(text).catch(() => {})
	toast.success(t('speed.copied'))
	return true
}

export const cutSelected = (data?: DataTransfer | null) => {
	const id = useProject.getState().selectedId
	if (!copySelected(data) || !id) return false
	deleteSelected()
	// Delete refuses locked places, then the node is still there
	if (findElement(currentRoots(), id)) {
		toast.error(t('speed.cannotCut'))
		return false
	}
	return true
}

const BLOCKED = {
	select: 'speed.pasteSelect',
	locked: 'speed.pasteLocked',
	editing: 'speed.pasteEditing',
} as const

// Inserts a payload after the selection, one undo step
const insertClip = (clip: ClipPayload) => {
	const roots = currentRoots()
	const { selectedId, editingComponentId } = useProject.getState()
	const { header, footer } = useDocument.getState().doc?.partials ?? {}
	const target = resolvePaste(clip.kind, {
		roots,
		sections: pageSections(),
		selectedId,
		headerId: header?.id,
		footerId: footer?.id,
		editing: Boolean(editingComponentId),
	})
	if ('blocked' in target) {
		toast.error(t(BLOCKED[target.blocked]))
		return false
	}
	const nodes = freshCopy(clip.nodes, randomId, hasComponent)
	const pageId = useProject.getState().currentPageId
	useDocument.getState().edit('Paste', (draft) => {
		if (target.kind === 'section') {
			if (pageId)
				draft.pages[pageId]?.sections.splice(target.index, 0, ...nodes)
			return
		}
		const master = editingComponentId
			? draft.components[editingComponentId]?.root
			: undefined
		const list = master
			? [master]
			: [
					...(draft.partials.header ? [draft.partials.header] : []),
					...(pageId ? (draft.pages[pageId]?.sections ?? []) : []),
					...(draft.partials.footer ? [draft.partials.footer] : []),
				]
		findElement(list, target.parentId)?.children.splice(
			target.index,
			0,
			...nodes
		)
	})
	useProject.getState().select(nodes[0].id)
	if (target.kind === 'element') {
		useNav.getState().setOpen([target.parentId])
	}
	return true
}

// Text from the paste event, else the system clipboard, else the memory copy
export const pasteClip = async (text?: string | null) => {
	let clip = parseClip(text)
	if (!clip && text === undefined) {
		try {
			clip = parseClip(await navigator.clipboard.readText())
		} catch {
			// Reading may be denied, the memory copy still works
		}
	}
	clip ??= memory
	if (!clip) {
		toast.error(t('speed.nothingToPaste'))
		return false
	}
	return insertClip(clip)
}

// Section: the existing action. Element: a copy right after it, free scope only
export const duplicateSelected = () => {
	const node = selectedNode()
	if (!node) return false
	const roots = currentRoots()
	const { editingComponentId } = useProject.getState()
	if (pageSections().some((s) => s.id === node.id)) {
		duplicateSection(node.id)
		return true
	}
	const at = locate(roots, node.id)
	if (
		!at?.parent ||
		isSectionRoot(node.id) ||
		scopeOf(roots, node.id, Boolean(editingComponentId)) !== 'free' ||
		at.parent.instance
	) {
		toast.error(t('speed.cannotDuplicate'))
		return false
	}
	const [copy] = freshCopy([node], randomId, hasComponent)
	const pageId = useProject.getState().currentPageId
	useDocument.getState().edit('Duplicate', (draft) => {
		const master = editingComponentId
			? draft.components[editingComponentId]?.root
			: undefined
		const list = master
			? [master]
			: [
					...(draft.partials.header ? [draft.partials.header] : []),
					...(pageId ? (draft.pages[pageId]?.sections ?? []) : []),
					...(draft.partials.footer ? [draft.partials.footer] : []),
				]
		const place = locate(list, node.id)
		place?.list.splice(place.index + 1, 0, copy)
	})
	useProject.getState().select(copy.id)
	return true
}
