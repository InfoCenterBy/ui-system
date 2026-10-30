import { useEffect, useMemo, useRef, useState } from 'react'
import { parseHtml, serializeHtml } from '@ui-system/core'

const VIRTUAL_WIDTH = 480
const HEIGHT = 80

const srcdocFor = (html: string, css: string) => {
	const body = serializeHtml(parseHtml(html), { pretty: false })
	return `<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>${css}</style><style>html,body{margin:0;overflow:hidden;background:var(--color-base-100,#fff)}body{padding:16px;pointer-events:none}</style></head><body>${body}</body></html>`
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
			className='bg-muted pointer-events-none relative w-full overflow-hidden rounded-sm border'
			style={{ height: HEIGHT }}
		>
			{srcDoc !== null && scale > 0 && (
				<iframe
					title={title}
					srcDoc={srcDoc}
					tabIndex={-1}
					className='absolute top-0 left-0 border-0'
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
