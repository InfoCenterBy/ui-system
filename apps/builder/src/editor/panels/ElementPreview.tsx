import { useEffect, useMemo, useRef, useState } from 'react'
import callyUrl from 'cally?url'
import { parseHtml, serializeHtml } from '@ui-system/core'

// Narrow virtual width keeps elements large, wide ones are clipped
const VIRTUAL_WIDTH = 380
const HEIGHT = 96

const srcdocFor = (html: string, css: string) => {
	const body = serializeHtml(parseHtml(html), { pretty: false })
	const cally = body.includes('<calendar-')
		? `<script type="module" src="${callyUrl}"></script>`
		: ''
	return `<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>${css}</style><style>html,body{margin:0;overflow:hidden;background:var(--color-base-200,#f3f4f6);color:var(--color-base-content,#111)}body{padding:12px;pointer-events:none}</style></head><body>${body}${cally}</body></html>`
}

// Small non-interactive preview, clipped to a fixed height
export function ElementPreview({
	html,
	css,
	title,
}: {
	html: string
	css: string | null
	title: string
}) {
	const hostRef = useRef<HTMLDivElement>(null)
	const [width, setWidth] = useState(0)
	const [loaded, setLoaded] = useState(false)
	useEffect(() => {
		const el = hostRef.current
		if (!el) return
		const resize = new ResizeObserver(([e]) =>
			setWidth(e.contentRect.width)
		)
		resize.observe(el)
		return () => resize.disconnect()
	}, [])
	const srcDoc = useMemo(
		() => (css !== null ? srcdocFor(html, css) : null),
		[html, css]
	)
	const scale = width / VIRTUAL_WIDTH
	return (
		<div
			ref={hostRef}
			className={`bg-muted pointer-events-none relative w-full overflow-hidden rounded-sm border ${loaded ? '' : 'animate-pulse'}`}
			style={{ height: HEIGHT }}
		>
			{srcDoc !== null && scale > 0 && (
				<iframe
					title={title}
					srcDoc={srcDoc}
					tabIndex={-1}
					className={`absolute top-0 left-0 border-0 transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
					onLoad={() => setLoaded(true)}
					style={{
						width: VIRTUAL_WIDTH,
						height: HEIGHT / scale,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
				/>
			)}
		</div>
	)
}
