import { useEffect, useMemo, useRef, useState } from 'react'
import {
	parseSection,
	serializeHtml,
	type SectionPreset,
} from '@ui-system/core'
import { sectionName } from '@/i18n/names'

const VIRTUAL_WIDTH = 1280
// Presets that only make sense on a phone, shown narrow with the menu open
const MOBILE_PRESETS = new Set(['header-mobile'])
const MOBILE_WIDTH = 390
// Tall sections are cut at 16:9, short ones (headers, banners) fit their content
const VIRTUAL_HEIGHT = 720
const MIN_HEIGHT = 48

// Measured content heights, so a card does not jump when it is shown again
const heights = new Map<string, number>()

const srcdocFor = (preset: SectionPreset, css: string) => {
	let html = serializeHtml([parseSection(preset)], { pretty: false })
	if (MOBILE_PRESETS.has(preset.id)) {
		html = html.replace(
			/class="dropdown /g,
			'class="dropdown dropdown-open '
		)
	}
	// Only html clips, a body that clips would cut the open menu
	return `<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>${css}</style><style>html{overflow:hidden}body{margin:0}</style></head><body>${html}</body></html>`
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
	const [visible, setVisible] = useState(false)
	const [width, setWidth] = useState(0)
	const [loaded, setLoaded] = useState(false)
	const [height, setHeight] = useState(() => heights.get(preset.id) ?? null)

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

	const virtualWidth = MOBILE_PRESETS.has(preset.id)
		? MOBILE_WIDTH
		: VIRTUAL_WIDTH
	const scale = width / virtualWidth
	// The frame follows the content until it is measured, then it fits it
	const measure = (frame: HTMLIFrameElement) => {
		const body = frame.contentDocument?.body
		if (!body) return
		// The root is never shorter than the frame, so measure the content, open menus included
		const content = Math.max(
			body.getBoundingClientRect().height,
			...Array.from(body.querySelectorAll('*'), (el) =>
				Math.ceil(el.getBoundingClientRect().bottom)
			)
		)
		if (!content) return
		const fit = Math.min(VIRTUAL_HEIGHT, Math.max(MIN_HEIGHT, content))
		heights.set(preset.id, fit)
		setHeight(fit)
	}
	return (
		<div
			ref={hostRef}
			className={`bg-muted relative w-full overflow-hidden rounded-sm border ${height === null ? 'aspect-video' : ''} ${loaded ? '' : 'animate-pulse'}`}
			style={
				height !== null && scale > 0
					? { height: height * scale }
					: undefined
			}
		>
			{srcDoc !== null && scale > 0 && (
				<iframe
					title={sectionName(preset.name)}
					srcDoc={srcDoc}
					tabIndex={-1}
					className={`pointer-events-none absolute top-0 left-0 border-0 bg-white transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
					style={{
						width: virtualWidth,
						height: VIRTUAL_HEIGHT,
						transform: `scale(${scale})`,
						transformOrigin: 'top left',
					}}
					onLoad={(e) => {
						setLoaded(true)
						measure(e.currentTarget)
					}}
				/>
			)}
		</div>
	)
}
