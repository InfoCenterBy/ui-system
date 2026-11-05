import { useEffect } from 'react'
import {
	NODE_ID_ATTR,
	REVEAL_EASE,
	REVEAL_SCRIPT,
	isElement,
	readReveal,
	readRevealConfig,
	revealCss,
	revealKeyframes,
	staggerDelay,
	usesReveal,
	type ElementNode,
	type RevealType,
} from '@ui-system/core'

// Replays the appear animation of a node, and of its staggered children, on the canvas
export const playReveal = (doc: Document, node: ElementNode) => {
	const config = readRevealConfig(node.attrs)
	const find = (id: string) =>
		doc.querySelector<HTMLElement>(`[${NODE_ID_ATTR}="${CSS.escape(id)}"]`)
	const run = (id: string, type: RevealType, delay: number) =>
		find(id)?.animate(revealKeyframes(type), {
			duration: config.duration,
			delay,
			easing: REVEAL_EASE,
			fill: 'backwards',
		})
	find(node.id)?.scrollIntoView({ block: 'nearest' })
	if (config.type) run(node.id, config.type, config.delay)
	if (!config.stagger) return
	// Same order as the exported script: every child counts, own animations are skipped
	node.children.filter(isElement).forEach((child, index) => {
		if (readReveal(child.attrs)) return
		run(
			child.id,
			config.stagger!.type,
			staggerDelay(config.delay, config.stagger!.step, index)
		)
	})
}

// In preview the canvas runs the exported CSS and script, so reveals work as on the site
export function useRevealPreview(
	doc: Document | null,
	roots: ElementNode[],
	preview: boolean
) {
	useEffect(() => {
		if (!doc || !preview || !usesReveal(roots)) return
		const style = doc.createElement('style')
		style.textContent = revealCss()
		const script = doc.createElement('script')
		script.textContent = `;(() => {\n${REVEAL_SCRIPT}\n})()`
		doc.head.append(style)
		doc.body.append(script)
		return () => {
			style.remove()
			script.remove()
			doc.documentElement.classList.remove('reveal-js')
		}
	}, [doc, roots, preview])
}
