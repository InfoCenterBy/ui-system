import { isElement, walk } from './tree'
import type { ElementNode, TreeNode } from './types'

// Appear-on-scroll animations are plain data attributes, the exported site.js and CSS read them

// Animation type on the element itself
export const REVEAL_ATTR = 'data-reveal'
export const REVEAL_DURATION_ATTR = 'data-reveal-duration'
export const REVEAL_DELAY_ATTR = 'data-reveal-delay'
// Present means every time the element scrolls into view, missing means once
export const REVEAL_REPEAT_ATTR = 'data-reveal-repeat'
// On a container: milliseconds between its children, with the type they use in data-reveal-items
export const REVEAL_STAGGER_ATTR = 'data-reveal-stagger'
export const REVEAL_ITEMS_ATTR = 'data-reveal-items'

export const REVEAL_TYPES = [
	'fade',
	'from-bottom',
	'from-top',
	'from-left',
	'from-right',
	'zoom',
] as const

export type RevealType = (typeof REVEAL_TYPES)[number]

export const REVEAL_DEFAULTS = { duration: 600, delay: 0, step: 120 }
export const REVEAL_MAX_MS = 5000

// Where an element starts, shared by the exported CSS and the canvas player
export const REVEAL_FROM: Record<RevealType, string | null> = {
	fade: null,
	'from-bottom': 'translateY(2rem)',
	'from-top': 'translateY(-2rem)',
	'from-left': 'translateX(-2rem)',
	'from-right': 'translateX(2rem)',
	zoom: 'scale(0.92)',
}

export interface RevealSettings {
	type: RevealType
	duration: number
	delay: number
	repeat: boolean
}

export interface StaggerSettings {
	// Type the children appear with
	type: RevealType
	step: number
}

type Attrs = Record<string, string>

export const isRevealType = (value: unknown): value is RevealType =>
	typeof value === 'string' &&
	(REVEAL_TYPES as readonly string[]).includes(value)

const clamp = (n: number) =>
	Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), REVEAL_MAX_MS) : 0

const ms = (value: string | undefined, fallback: number) => {
	const n = Number.parseInt(value ?? '', 10)
	return Number.isFinite(n) && n >= 0 ? Math.min(n, REVEAL_MAX_MS) : fallback
}

// Duration, delay and repeat are shared by the element and by its staggered children
const timing = (attrs: Attrs) => ({
	duration: ms(attrs[REVEAL_DURATION_ATTR], REVEAL_DEFAULTS.duration),
	delay: ms(attrs[REVEAL_DELAY_ATTR], REVEAL_DEFAULTS.delay),
	repeat: REVEAL_REPEAT_ATTR in attrs,
})

export const readReveal = (attrs: Attrs): RevealSettings | null => {
	const type = attrs[REVEAL_ATTR]
	return isRevealType(type) ? { type, ...timing(attrs) } : null
}

export const readStagger = (attrs: Attrs): StaggerSettings | null => {
	const type = attrs[REVEAL_ITEMS_ATTR]
	if (!(REVEAL_STAGGER_ATTR in attrs) || !isRevealType(type)) return null
	return { type, step: ms(attrs[REVEAL_STAGGER_ATTR], REVEAL_DEFAULTS.step) }
}

export interface RevealConfig {
	// Animation of the element itself
	type: RevealType | null
	// Children appearing one after another
	stagger: StaggerSettings | null
	duration: number
	delay: number
	repeat: boolean
}

export const readRevealConfig = (attrs: Attrs): RevealConfig => ({
	type: readReveal(attrs)?.type ?? null,
	stagger: readStagger(attrs),
	...timing(attrs),
})

const OWN_ATTRS = new Set([
	REVEAL_ATTR,
	REVEAL_STAGGER_ATTR,
	REVEAL_ITEMS_ATTR,
	REVEAL_DURATION_ATTR,
	REVEAL_DELAY_ATTR,
	REVEAL_REPEAT_ATTR,
])

// New attributes with the reveal ones replaced, other attributes keep their order.
// Defaults are not written, and nothing is written without a type or a stagger
export const writeRevealConfig = (
	attrs: Attrs,
	config: RevealConfig
): Attrs => {
	const next: Attrs = {}
	for (const [name, value] of Object.entries(attrs)) {
		if (!OWN_ATTRS.has(name)) next[name] = value
	}
	const { type, stagger } = config
	if (type) next[REVEAL_ATTR] = type
	if (stagger) {
		next[REVEAL_STAGGER_ATTR] = String(clamp(stagger.step))
		next[REVEAL_ITEMS_ATTR] = stagger.type
	}
	if (!type && !stagger) return next
	const duration = clamp(config.duration)
	const delay = clamp(config.delay)
	if (duration !== REVEAL_DEFAULTS.duration)
		next[REVEAL_DURATION_ATTR] = String(duration)
	if (delay !== REVEAL_DEFAULTS.delay) next[REVEAL_DELAY_ATTR] = String(delay)
	if (config.repeat) next[REVEAL_REPEAT_ATTR] = ''
	return next
}

export interface RevealEntry {
	node: ElementNode
	reveal: RevealSettings | null
	stagger: StaggerSettings | null
}

// Every element of the tree that appears on scroll or staggers its children, in page order
export const collectReveals = (roots: TreeNode[]): RevealEntry[] => {
	const found: RevealEntry[] = []
	walk(roots, (node) => {
		if (!isElement(node)) return
		const reveal = readReveal(node.attrs)
		const stagger = readStagger(node.attrs)
		if (reveal || stagger) found.push({ node, reveal, stagger })
	})
	return found
}

export const usesReveal = (roots: TreeNode[]) =>
	collectReveals(roots).length > 0

// Milliseconds after which the element at index i of a staggered group starts
export const staggerDelay = (base: number, step: number, index: number) =>
	base + step * index

export const REVEAL_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
const EASE = REVEAL_EASE

// Keyframes for the canvas player, from the hidden state to the plain element
export const revealKeyframes = (type: RevealType) => [
	{ opacity: 0, transform: REVEAL_FROM[type] ?? 'none' },
	{ opacity: 1, transform: 'none' },
]

// Hidden only after the script marked the page, and never for reduced motion
export const revealCss = () => {
	const from = REVEAL_TYPES.filter((type) => REVEAL_FROM[type]).map(
		(type) =>
			`.reveal-js [data-reveal="${type}"]:not(.is-revealed){transform:${REVEAL_FROM[type]}}`
	)
	const move = `opacity var(--reveal-duration,${REVEAL_DEFAULTS.duration}ms) ${EASE} var(--reveal-delay,0ms),transform var(--reveal-duration,${REVEAL_DEFAULTS.duration}ms) ${EASE} var(--reveal-delay,0ms)`
	return [
		'@media (prefers-reduced-motion:no-preference){',
		'.reveal-js [data-reveal]:not(.is-revealed){opacity:0}',
		// Staggered children get data-reveal from site.js, hide them until then
		'.reveal-js [data-reveal-items] > :not(.is-revealed){opacity:0}',
		...from,
		`.reveal-js [data-reveal].is-revealed{transition:${move}}`,
		'}',
		'',
	].join('\n')
}

// Inline in <head>: hides reveals before the first paint and shows everything
// again if site.js has not started within a few seconds
export const REVEAL_HEAD_SCRIPT = `(function(r){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;r.classList.add('reveal-js');setTimeout(function(){if(!r.classList.contains('reveal-on'))r.classList.remove('reveal-js')},3000)})(document.documentElement)`

// Marks the page, then shows each element once it scrolls into view
export const REVEAL_SCRIPT = `const root = document.documentElement
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
	const num = (el, name, fallback) => {
		const value = parseInt(el.getAttribute(name), 10)
		return value >= 0 ? value : fallback
	}
	const groups = new Map()
	const staged = new Set()
	const add = (watch, el) => {
		const list = groups.get(watch) || []
		list.push(el)
		groups.set(watch, list)
	}
	document.querySelectorAll('[data-reveal-stagger]').forEach((box) => {
		const type = box.getAttribute('data-reveal-items')
		if (!type) return
		const step = num(box, 'data-reveal-stagger', ${REVEAL_DEFAULTS.step})
		const delay = num(box, 'data-reveal-delay', 0)
		Array.from(box.children).forEach((el, index) => {
			if (el.hasAttribute('data-reveal')) return
			el.setAttribute('data-reveal', type)
			el.setAttribute('data-reveal-delay', delay + step * index)
			if (box.hasAttribute('data-reveal-duration')) el.setAttribute('data-reveal-duration', box.getAttribute('data-reveal-duration'))
			staged.add(el)
			add(box, el)
		})
	})
	document.querySelectorAll('[data-reveal]').forEach((el) => {
		if (!staged.has(el)) add(el, el)
	})
	groups.forEach((list) => list.forEach((el) => {
		el.style.setProperty('--reveal-duration', num(el, 'data-reveal-duration', ${REVEAL_DEFAULTS.duration}) + 'ms')
		el.style.setProperty('--reveal-delay', num(el, 'data-reveal-delay', 0) + 'ms')
	}))
	const io = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			const watch = entry.target
			const list = groups.get(watch) || []
			if (entry.isIntersecting) {
				list.forEach((el) => el.classList.add('is-revealed'))
				if (watch.hasAttribute('data-reveal-repeat')) return
				io.unobserve(watch)
				// Once shown, the element is plain again so its own transitions are not delayed
				list.forEach((el) => setTimeout(() => el.removeAttribute('data-reveal'), num(el, 'data-reveal-duration', ${REVEAL_DEFAULTS.duration}) + num(el, 'data-reveal-delay', 0) + 100))
			} else if (watch.hasAttribute('data-reveal-repeat')) {
				list.forEach((el) => el.classList.remove('is-revealed'))
			}
		})
	}, { rootMargin: '0px 0px -8% 0px' })
	root.classList.add('reveal-js', 'reveal-on')
	root.offsetWidth
	groups.forEach((list, watch) => io.observe(watch))
}`
