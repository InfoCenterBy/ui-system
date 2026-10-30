import { isElement, walk, type TreeNode } from '@ui-system/core'

// Opens dialogs and popovers through commandfor in browsers without the Invoker Commands API
const COMMANDS = `if (!('command' in HTMLButtonElement.prototype)) {
	document.addEventListener('click', (event) => {
		const button = event.target.closest && event.target.closest('button[commandfor]')
		const target = button && document.getElementById(button.getAttribute('commandfor'))
		if (!target) return
		const run = {
			'show-modal': 'showModal',
			close: 'close',
			'request-close': 'close',
			'show-popover': 'showPopover',
			'hide-popover': 'hidePopover',
			'toggle-popover': 'togglePopover',
		}[button.getAttribute('command')]
		if (run && target[run]) target[run]()
	})
}`

// Counts the time left to data-countdown-to into the child spans marked data-countdown
const COUNTDOWN = `document.querySelectorAll('[data-countdown-to]').forEach((root) => {
	const end = new Date(root.getAttribute('data-countdown-to')).getTime()
	if (Number.isNaN(end)) return
	const tick = () => {
		const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
		const values = {
			days: Math.floor(left / 86400),
			hours: Math.floor(left / 3600) % 24,
			minutes: Math.floor(left / 60) % 60,
			seconds: left % 60,
		}
		root.querySelectorAll('[data-countdown]').forEach((el) => {
			const value = values[el.getAttribute('data-countdown')]
			if (value === undefined) return
			el.style.setProperty('--value', value)
			el.setAttribute('aria-label', value)
			el.textContent = value
		})
	}
	tick()
	setInterval(tick, 1000)
})`

export interface PageFeatures {
	commands: boolean
	countdown: boolean
	calendar: boolean
}

// What a page needs beyond HTML and CSS
export const detectFeatures = (roots: TreeNode[]): PageFeatures => {
	const features = { commands: false, countdown: false, calendar: false }
	walk(roots, (node) => {
		if (!isElement(node)) return
		if (node.attrs.commandfor !== undefined) features.commands = true
		if (node.attrs['data-countdown-to'] !== undefined)
			features.countdown = true
		if (node.tag.toLowerCase().startsWith('calendar-'))
			features.calendar = true
	})
	return features
}

// Code for site.js, only the parts the page uses
export const featureScripts = (features: PageFeatures) => [
	...(features.commands ? [COMMANDS] : []),
	...(features.countdown ? [COUNTDOWN] : []),
]
