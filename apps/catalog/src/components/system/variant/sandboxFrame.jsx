import { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import tailwindUrl from '@tailwindcss/browser?url'
import callyUrl from 'cally?url'
import { DAISY_THEME_CSS } from '@ui-system/theme'

const ROOT_CLASS =
	'flex min-h-32 flex-wrap items-center justify-center gap-4 p-6'
const MIN_HEIGHT = 128
const LOAD_TIMEOUT = 8000
const MAX_ATTEMPTS = 3

const TAILWIND_CONFIG = `@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities);
${DAISY_THEME_CSS}`

const hasScript = (html) => /<script[\s>]/i.test(html)
const hasCalendar = (html) => /<calendar-/i.test(html)

const escapeAttr = (value) => value.replace(/"/g, '&quot;')

// The site stylesheets already hold every daisyUI component and theme, the iframe reuses them from cache
const siteStyles = () =>
	[
		...document.querySelectorAll(
			'link[rel="stylesheet"], style[data-vite-dev-id]'
		),
	]
		.map((node) =>
			node.localName === 'link'
				? `<link rel="stylesheet" href="${escapeAttr(node.href)}">`
				: `<style>${node.textContent}</style>`
		)
		.join('\n')

const tailwindTags = () =>
	`<style type="text/tailwindcss">${TAILWIND_CONFIG}</style><script src="${tailwindUrl}"></script>`

// The document every example runs in
const buildSrcdoc = ({
	html,
	rootClass,
	theme,
	customCss,
	live,
}) => `<!doctype html>
<html data-theme="${escapeAttr(theme)}" class="bg-base-200">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${siteStyles()}
<style>html{overflow-y:hidden;scroll-behavior:auto}html,body{min-width:0}body{display:block;min-height:0}</style>
<style id="custom-theme">${customCss}</style>
${live ? tailwindTags() : ''}
${hasCalendar(html) ? `<script type="module" src="${callyUrl}"></script>` : ''}
</head>
<body class="text-base-content">
<div id="preview" class="${escapeAttr(`${ROOT_CLASS} ${rootClass ?? ''}`)}">${html}</div>
</body>
</html>`

const OVERFLOW_GAP = 24
// Picker margin, padding and border around the options
const PICKER_FRAME = 26

const isOpen = (el) => {
	try {
		return el.matches(':open')
	} catch {
		return false
	}
}

// Room a daisyUI select needs below it for its picker, which is clipped by the iframe
const pickerBottom = (select, rect) => {
	const last = select.options[select.options.length - 1]
	const lastRect = last?.getBoundingClientRect()
	const bottom =
		isOpen(select) && lastRect?.height
			? lastRect.bottom + PICKER_FRAME / 2
			: rect.bottom +
				PICKER_FRAME +
				select.options.length * Math.max(28, rect.height * 0.85)
	// The picker is limited to 70% of the viewport height
	return Math.max(bottom, (bottom - rect.bottom) / 0.7)
}

const clipsContent = (style) =>
	style.overflowX !== 'visible' || style.overflowY !== 'visible'

// Lowest point of the content, fixed layers and modals are left out
const contentHeight = (win, root) => {
	const rootBottom = root.getBoundingClientRect().bottom
	const viewport = win.innerHeight
	const basePicker = win.CSS.supports('appearance', 'base-select')
	let bottom = rootBottom
	const walk = (el) => {
		for (const child of el.children) {
			if (child.matches(':popover-open')) {
				bottom = Math.max(bottom, child.getBoundingClientRect().bottom)
				continue
			}
			const style = win.getComputedStyle(child)
			if (
				style.display === 'none' ||
				style.position === 'fixed' ||
				child.localName === 'dialog'
			) {
				continue
			}
			const rect = child.getBoundingClientRect()
			// Heights tied to the viewport would grow with the iframe forever
			if (Math.abs(rect.height - viewport) < 1) continue
			bottom = Math.max(bottom, rect.bottom)
			if (
				basePicker &&
				child.matches('select.select:enabled, .select select:enabled')
			) {
				bottom = Math.max(bottom, pickerBottom(child, rect))
			}
			// Content scrolled or clipped inside a box does not add height
			if (!clipsContent(style)) walk(child)
		}
	}
	if (!clipsContent(win.getComputedStyle(root))) walk(root)
	// Dropdowns sticking out of the root get the same breathing room as padding
	const end = bottom > rootBottom + 1 ? bottom + OVERFLOW_GAP : rootBottom
	// A horizontal scrollbar takes height too
	const scrollbar = viewport - win.document.documentElement.clientHeight
	return Math.ceil(end + win.scrollY + scrollbar)
}

// Mouse wheel moves horizontal carousels one item at a time
const createCarouselWheel = () => {
	let last = 0
	return (e) => {
		const carousel = e.target.closest?.('.carousel:not(.carousel-vertical)')
		if (!carousel || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
		const max = carousel.scrollWidth - carousel.clientWidth
		const dir = Math.sign(e.deltaY)
		if (max <= 0) return
		if (dir < 0 && carousel.scrollLeft <= 0) return
		if (dir > 0 && carousel.scrollLeft >= max - 1) return
		e.preventDefault()
		if (e.timeStamp - last < 350) return
		last = e.timeStamp
		const box = carousel.getBoundingClientRect()
		const items = [...carousel.children]
		const target =
			dir > 0
				? items.find(
						(i) => i.getBoundingClientRect().left > box.left + 1
					)
				: items.findLast(
						(i) => i.getBoundingClientRect().left < box.left - 1
					)
		if (target) {
			carousel.scrollBy({
				left: target.getBoundingClientRect().left - box.left,
				behavior: 'smooth',
			})
		}
	}
}

const isScrollable = (win, el) => {
	const style = win.getComputedStyle(el)
	return (
		(/auto|scroll/.test(style.overflowX) &&
			el.scrollWidth > el.clientWidth) ||
		(/auto|scroll/.test(style.overflowY) &&
			el.scrollHeight > el.clientHeight)
	)
}

// Links stay inside the example, hash links scroll their own box like carousel buttons
const createLinkHandler = (win) => (e) => {
	const link = e.target.closest?.('a[href]')
	if (!link || link.target === '_blank') return
	e.preventDefault()
	const hash = link.getAttribute('href')
	if (!hash.startsWith('#') || hash.length < 2) return
	const target = win.document.getElementById(
		decodeURIComponent(hash.slice(1))
	)
	let box = target?.parentElement
	while (box && box !== win.document.body && !isScrollable(win, box)) {
		box = box.parentElement
	}
	if (!target || !box || box === win.document.body) return
	const from = box.getBoundingClientRect()
	const to = target.getBoundingClientRect()
	box.scrollBy({
		left: to.left - from.left,
		top: to.top - from.top,
		behavior: 'smooth',
	})
}

const WATCHED_EVENTS = [
	'click',
	'input',
	'change',
	'toggle',
	'keyup',
	'focusin',
	'focusout',
	'transitionend',
	'animationend',
	'load',
]

// Lets the iframe grow with its content and keeps demo forms and links on the page
const attach = (frame, onHeight) => {
	const win = frame.contentWindow
	const doc = win.document
	const root = doc.getElementById('preview')
	let raf = 0
	let poll = 0
	const measure = () => {
		win.cancelAnimationFrame(raf)
		raf = win.requestAnimationFrame(() => {
			onHeight(contentHeight(win, root))
			// An open select picker moves without events, follow it until it closes
			win.clearTimeout(poll)
			if ([...root.querySelectorAll('select')].some(isOpen)) {
				poll = win.setTimeout(measure, 120)
			}
		})
	}
	const onSubmit = (e) => {
		if (e.target.method !== 'dialog') e.preventDefault()
	}
	// Validation hints come from the example, not the browser bubble
	const onInvalid = (e) => e.preventDefault()
	const onWheel = createCarouselWheel()
	const onLink = createLinkHandler(win)

	const resizeObserver = new win.ResizeObserver(measure)
	resizeObserver.observe(root)
	const mutationObserver = new win.MutationObserver(measure)
	mutationObserver.observe(root, {
		subtree: true,
		childList: true,
		attributes: true,
	})
	WATCHED_EVENTS.forEach((type) => doc.addEventListener(type, measure, true))
	doc.addEventListener('submit', onSubmit, true)
	doc.addEventListener('invalid', onInvalid, true)
	doc.addEventListener('click', onLink)
	doc.addEventListener('wheel', onWheel, { passive: false })
	measure()

	return () => {
		win.cancelAnimationFrame(raf)
		win.clearTimeout(poll)
		resizeObserver.disconnect()
		mutationObserver.disconnect()
		WATCHED_EVENTS.forEach((type) =>
			doc.removeEventListener(type, measure, true)
		)
		doc.removeEventListener('submit', onSubmit, true)
		doc.removeEventListener('invalid', onInvalid, true)
		doc.removeEventListener('click', onLink)
		doc.removeEventListener('wheel', onWheel)
	}
}

const injectTailwind = (doc) => {
	if (doc.querySelector('style[type="text/tailwindcss"]')) return
	const config = doc.createElement('style')
	config.type = 'text/tailwindcss'
	config.textContent = TAILWIND_CONFIG
	const script = doc.createElement('script')
	script.src = tailwindUrl
	doc.head.append(config, script)
}

// Mounts the iframe only when it gets close to the screen
const useNearViewport = (ref) => {
	const [near, setNear] = useState(false)
	useEffect(() => {
		if (near) return
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) setNear(true)
			},
			{ rootMargin: '600px 0px' }
		)
		observer.observe(ref.current)
		return () => observer.disconnect()
	}, [near, ref])
	return near
}

// Last measured heights, so coming back to a page does not jump
const heightCache = new Map()

const SandboxFrame = ({
	html,
	rootClass,
	theme,
	customCss,
	width,
	title,
	live = false,
}) => {
	const holderRef = useRef(null)
	const frameRef = useRef(null)
	const detachRef = useRef(null)
	const attachedDoc = useRef(null)
	const latest = useRef({ html, rootClass, theme, customCss, live })
	const cacheKey = `${title}|${width}`
	const near = useNearViewport(holderRef)
	const [height, setHeight] = useState(
		() => heightCache.get(cacheKey) ?? MIN_HEIGHT
	)
	const [ready, setReady] = useState(false)
	const [attempt, setAttempt] = useState(0)
	const [srcdoc, setSrcdoc] = useState(() =>
		buildSrcdoc({ html, rootClass, theme, customCss, live })
	)

	useEffect(() => {
		latest.current = { html, rootClass, theme, customCss, live }
	})

	const getDoc = () => {
		const doc = frameRef.current?.contentDocument
		return doc?.getElementById('preview') ? doc : null
	}

	// Plain markup is patched in place, scripts and calendars need a fresh document
	useEffect(() => {
		const doc = getDoc()
		const needsReload =
			hasScript(html) ||
			(hasCalendar(html) &&
				!doc?.defaultView.customElements.get('calendar-date'))
		if (doc && !needsReload) {
			const root = doc.getElementById('preview')
			if (root.innerHTML !== html) root.innerHTML = html
			root.className = `${ROOT_CLASS} ${rootClass ?? ''}`
			return
		}
		const timer = setTimeout(
			() => setSrcdoc(buildSrcdoc(latest.current)),
			300
		)
		return () => clearTimeout(timer)
	}, [html, rootClass])

	useEffect(() => {
		const doc = getDoc()
		if (!doc) return
		doc.documentElement.setAttribute('data-theme', theme)
		doc.getElementById('custom-theme').textContent = customCss
	}, [theme, customCss])

	// Tailwind compiles classes in the browser only once the code is edited
	useEffect(() => {
		const doc = getDoc()
		if (live && doc) injectTailwind(doc)
	}, [live])

	useEffect(() => () => detachRef.current?.(), [])

	const onHeight = (value) => {
		heightCache.set(cacheKey, value)
		setHeight(value)
		setReady(true)
	}

	// Runs once the markup is parsed, images keep loading after that
	const connect = () => {
		const frame = frameRef.current
		const doc = getDoc()
		if (!doc || doc.readyState === 'loading') return
		if (attachedDoc.current === doc) return
		attachedDoc.current = doc
		detachRef.current?.()
		// Catch up with edits and theme changes made while loading
		const current = latest.current
		doc.documentElement.setAttribute('data-theme', current.theme)
		doc.getElementById('custom-theme').textContent = current.customCss
		const root = doc.getElementById('preview')
		if (!hasScript(current.html) && root.innerHTML !== current.html) {
			root.innerHTML = current.html
		}
		if (current.live) injectTailwind(doc)
		detachRef.current = attach(frame, onHeight)
	}
	const connectRef = useRef(connect)
	useEffect(() => {
		connectRef.current = connect
	})

	// Polling connects as soon as the markup is parsed, a stuck frame is rebuilt
	useEffect(() => {
		if (!near || ready) return
		const started = Date.now()
		const timer = setInterval(() => {
			connectRef.current()
			if (Date.now() - started < LOAD_TIMEOUT) return
			clearInterval(timer)
			if (attempt + 1 >= MAX_ATTEMPTS) return
			detachRef.current?.()
			detachRef.current = null
			attachedDoc.current = null
			setSrcdoc(buildSrcdoc(latest.current))
			setAttempt(attempt + 1)
		}, 50)
		return () => clearInterval(timer)
	}, [near, ready, attempt])

	return (
		<div
			ref={holderRef}
			className='relative mx-auto max-w-full transition-[width] duration-300'
			style={{ width, height }}
		>
			{!ready && (
				<div
					aria-hidden='true'
					className='absolute inset-0 skeleton rounded-none bg-base-200'
				/>
			)}
			{near && (
				<iframe
					key={attempt}
					ref={frameRef}
					title={title}
					srcDoc={srcdoc}
					onLoad={connect}
					className={classNames(
						'block size-full border-0 transition-opacity duration-300',
						ready ? 'opacity-100' : 'opacity-0'
					)}
				/>
			)}
		</div>
	)
}

export default SandboxFrame
