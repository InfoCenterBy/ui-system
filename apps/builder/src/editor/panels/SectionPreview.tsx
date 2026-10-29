import { useEffect, useMemo, useRef, useState } from 'react'
import {
	parseSection,
	serializeHtml,
	type SectionPreset,
} from '@ui-system/core'

const VIRTUAL_WIDTH = 1280

const srcdocFor = (preset: SectionPreset, css: string) => {
	const html = serializeHtml([parseSection(preset)], { pretty: false })
	return `<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>${css}</style><style>html,body{margin:0;overflow:hidden}</style></head><body>${html}</body></html>`
}

// Thumbnail of a preset: a 1280px wide iframe scaled to the available width
export function SectionPreview({
	preset,
	css,
}: {
	preset: SectionPreset
	css: string | null
}) {
	const hostRef = useRef<HTMLDivElement>(null)
	const frameRef = useRef<HTMLIFrameElement>(null)
	const [visible, setVisible] = useState(false)
	const [width, setWidth] = useState(0)
	const [height, setHeight] = useState(720)

	useEffect(() => {
		const el = hostRef.current
		if (!el) return
		const resize = new ResizeObserver(([e]) =>
			setWidth(e.contentRect.width)
		)
		resize.observe(el)
		const intersect = new IntersectionObserver(([e]) => {
			if (e.isIntersecting) setVisible(true)
		})
		intersect.observe(el)
		return () => {
			resize.disconnect()
			intersect.disconnect()
		}
	}, [])

	const srcDoc = useMemo(
		() => (visible && css !== null ? srcdocFor(preset, css) : null),
		[visible, css, preset]
	)

	const scale = width / VIRTUAL_WIDTH
	return (
		<div
			ref={hostRef}
			className='bg-muted relative w-full overflow-hidden rounded-sm border'
			style={{ height: height * scale || 80 }}
		>
			{srcDoc !== null && (
				<iframe
					ref={frameRef}
					title={preset.name}
					srcDoc={srcDoc}
					tabIndex={-1}
					className='pointer-events-none absolute top-0 left-0 border-0 bg-white'
					style={{
						width: VIRTUAL_WIDTH,
						height,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
					onLoad={() => {
						const h =
							frameRef.current?.contentDocument?.body.scrollHeight
						if (h) setHeight(h)
					}}
				/>
			)}
		</div>
	)
}
