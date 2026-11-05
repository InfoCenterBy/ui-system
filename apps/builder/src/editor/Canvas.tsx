import { useEffect, useRef, useState } from 'react'
import { locate, resolveLayout } from '@ui-system/core'
import { useCanvas } from '@/editor/canvas/canvasStore'
import {
	createFrameCache,
	frameSrcdoc,
	nodeIdAt,
	syncRoots,
	syncShell,
} from '@/editor/canvas/frame'
import { pickTarget } from '@/editor/canvas/nodes'
import { DropIndicator } from '@/editor/canvas/DropIndicator'
import { InlineToolbar } from '@/editor/canvas/InlineToolbar'
import { Overlay } from '@/editor/canvas/Overlay'
import { useCanvasAutohide } from '@/editor/canvas/autohide'
import { useCanvasCss } from '@/editor/canvas/useCanvasCss'
import { useCanvasDrop } from '@/editor/canvas/useCanvasDrop'
import { useInlineEditing } from '@/editor/canvas/useInlineEditing'
import { useRevealOpen } from '@/editor/canvas/useRevealOpen'
import { useRevealPreview } from '@/editor/canvas/revealPlay'
import { useRoots } from '@/editor/canvas/useRoots'
import { useCurrentPageMark } from '@/editor/canvas/useCurrentPageMark'
import { useTranslation } from 'react-i18next'
import { useDocument } from '@/store/document'
import { useCurrentPage, useProject } from '@/store/project'
import { useUi } from '@/store/ui'
import { previewLinkTarget } from '@/editor/canvas/previewLinks'

const PADDING = 24

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
	const [size, setSize] = useState({ width: 0, height: 0 })
	useEffect(() => {
		const el = ref.current
		if (!el) return
		const observer = new ResizeObserver(([entry]) =>
			setSize({
				width: entry.contentRect.width,
				height: entry.contentRect.height,
			})
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [ref])
	return size
}

export function Canvas() {
	const { t } = useTranslation()
	const width = useProject((s) => s.canvasWidth)
	const theme = useDocument((s) => s.doc?.site.theme)
	const siteLayout = useDocument((s) => s.doc?.site.layout)
	const header = useDocument((s) => s.doc?.partials.header ?? null)
	const footer = useDocument((s) => s.doc?.partials.footer ?? null)
	const page = useCurrentPage()
	const editingComponent = useProject((s) => s.editingComponentId)
	const roots = useRoots()
	const preview = useUi((s) => s.preview)
	const storeDoc = useCanvas((s) => s.doc)
	const setDoc = useCanvas((s) => s.setDoc)
	// A remount (preview on or off) must not draw into the previous frame's document
	const [frameDoc, setFrameDoc] = useState<Document | null>(null)
	const doc = storeDoc === frameDoc ? storeDoc : null
	const editingId = useCanvas((s) => s.editingId)
	const containerRef = useRef<HTMLDivElement>(null)
	const frameRef = useRef<HTMLIFrameElement>(null)
	const [cache] = useState(createFrameCache)
	const [srcdoc] = useState(frameSrcdoc)
	const rootsRef = useRef(roots)
	const size = useContainerSize(containerRef)

	useEffect(() => {
		rootsRef.current = roots
	}, [roots])

	useEffect(() => () => setDoc(null), [setDoc])

	// The root that holds the slot being edited inline
	const editingRoot = editingId
		? (roots.find((root) => locate([root], editingId))?.id ?? null)
		: null

	useEffect(() => {
		if (doc) syncRoots(doc, cache, roots, editingRoot)
	}, [doc, cache, roots, editingRoot])

	// Same page shell as the export, after the roots are drawn
	useEffect(() => {
		if (!doc) return
		const shown = page && !editingComponent
		syncShell(
			doc,
			{
				header: shown && page.showHeader ? (header?.id ?? null) : null,
				footer: shown && page.showFooter ? (footer?.id ?? null) : null,
			},
			resolveLayout(siteLayout)
		)
	}, [doc, roots, siteLayout, page, header, footer, editingComponent])

	useCurrentPageMark(doc, roots)
	useCanvasAutohide()
	useRevealOpen(doc, roots)
	useRevealPreview(doc, roots, preview)
	useCanvasCss(doc, roots, theme)
	useInlineEditing(preview ? null : doc, rootsRef)

	// Pointer and form events stay inside the canvas
	useEffect(() => {
		if (!doc) return
		const { hover, select } = useProject.getState()
		const target = (e: Event) =>
			pickTarget(
				rootsRef.current,
				nodeIdAt(e.target),
				Boolean(useProject.getState().editingComponentId)
			)
		const onMove = (e: MouseEvent) => hover(target(e))
		const onLeave = () => hover(null)
		const onClick = (e: MouseEvent) => {
			const editing = useCanvas.getState().editingId
			if (
				editing &&
				(e.target as Element).closest?.('[contenteditable]')
			) {
				return
			}
			e.preventDefault()
			select(target(e))
		}
		const onSubmit = (e: Event) => e.preventDefault()
		if (preview) {
			// Visitor view: only links to other pages and sites need care
			const onLink = (e: MouseEvent) => {
				const link = (e.target as Element).closest?.('a[href]')
				const href = link?.getAttribute('href')
				if (!link || !href || e.defaultPrevented) return
				// The export opens linked popups with site.js, the canvas has none
				const popup = href.startsWith('#')
					? doc.getElementById(href.slice(1))
					: null
				if (popup?.tagName === 'DIALOG') {
					e.preventDefault()
					;(popup as HTMLDialogElement).showModal()
					return
				}
				const pages = useDocument.getState().doc?.pages ?? {}
				const go = previewLinkTarget(href, Object.values(pages))
				if (go.kind === 'blocked') e.preventDefault()
				else if (go.kind === 'page') {
					e.preventDefault()
					useProject.getState().setCurrentPage(go.id)
				} else if (go.kind === 'external') {
					e.preventDefault()
					window.open(href, '_blank', 'noopener')
				}
			}
			doc.addEventListener('click', onLink)
			return () => doc.removeEventListener('click', onLink)
		}
		doc.addEventListener('mousemove', onMove)
		doc.documentElement.addEventListener('mouseleave', onLeave)
		doc.addEventListener('click', onClick, true)
		doc.addEventListener('submit', onSubmit, true)
		return () => {
			doc.removeEventListener('mousemove', onMove)
			doc.documentElement.removeEventListener('mouseleave', onLeave)
			doc.removeEventListener('click', onClick, true)
			doc.removeEventListener('submit', onSubmit, true)
		}
	}, [doc, preview])

	const available = Math.max(size.width - PADDING * 2, 100)
	const scale = Math.min(1, available / width)
	const height = Math.max(size.height - PADDING * 2, 100) / scale
	const drop = useCanvasDrop(scale)

	return (
		<div
			ref={containerRef}
			className='bg-muted relative h-full overflow-hidden'
			onClick={(e) => {
				if (e.target === e.currentTarget)
					useProject.getState().select(null)
			}}
		>
			<div
				className='absolute shadow-sm'
				style={{
					top: PADDING,
					left: Math.max(PADDING, (size.width - width * scale) / 2),
					width,
					height,
					transform: `scale(${scale})`,
					transformOrigin: 'top left',
				}}
			>
				<iframe
					ref={frameRef}
					title={t('canvas.title')}
					srcDoc={srcdoc}
					className='block size-full border-0 bg-white'
					onLoad={() => {
						const loaded = frameRef.current?.contentDocument ?? null
						setFrameDoc(loaded)
						setDoc(loaded)
					}}
				/>
				{!preview && (
					<>
						<Overlay scale={scale} />
						<DropIndicator drop={drop} scale={scale} />
						<InlineToolbar scale={scale} />
					</>
				)}
			</div>
		</div>
	)
}
