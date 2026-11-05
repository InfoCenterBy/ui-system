import {
	REVEAL_SCRIPT,
	isElement,
	readReveal,
	readStagger,
	walk,
	type TreeNode,
} from '@ui-system/core'

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

// Slides the header out on scrolling down and back on scrolling up, the CSS transition comes from its classes
const AUTOHIDE = `const header = document.querySelector('[data-header="autohide"]')
if (header) {
	let last = window.scrollY
	window.addEventListener(
		'scroll',
		() => {
			const y = Math.max(0, window.scrollY)
			if (Math.abs(y - last) < 8) return
			const hide =
				y > last &&
				y > header.offsetHeight &&
				!header.contains(document.activeElement)
			header.style.transform = hide ? 'translateY(-100%)' : ''
			last = y
		},
		{ passive: true }
	)
}`

// A link to #id opens the dialog or popover with that id, also when the page loads with that hash
const POPUP_LINKS = `const openPopup = (id) => {
	const target = id && document.getElementById(id)
	if (!target) return false
	try {
		if (target.matches('dialog')) {
			if (!target.open) target.showModal()
		} else if (target.hasAttribute('popover')) target.showPopover()
		else return false
	} catch (error) {
		return false
	}
	return true
}
document.addEventListener('click', (event) => {
	const link = event.target.closest && event.target.closest('a[href^="#"]')
	const href = link && link.getAttribute('href')
	if (href && href.length > 1 && openPopup(decodeURIComponent(href.slice(1)))) event.preventDefault()
})
if (location.hash.length > 1) openPopup(decodeURIComponent(location.hash.slice(1)))`

export interface PageFeatures {
	commands: boolean
	popupLinks: boolean
	countdown: boolean
	calendar: boolean
	autohide: boolean
	// Appear-on-scroll animations, they also need the reveal CSS
	reveal: boolean
}

// What a page needs beyond HTML and CSS
export const detectFeatures = (roots: TreeNode[]): PageFeatures => {
	const features = {
		commands: false,
		popupLinks: false,
		countdown: false,
		calendar: false,
		autohide: false,
		reveal: false,
	}
	const popups = new Set<string>()
	const hashes: string[] = []
	walk(roots, (node) => {
		if (!isElement(node)) return
		const id = node.attrs.id
		const dialog =
			node.tag.toLowerCase() === 'dialog' &&
			node.classes.split(/\s+/).includes('modal')
		if (id && (dialog || 'popover' in node.attrs)) popups.add(id)
		const href = node.attrs.href
		if (node.tag.toLowerCase() === 'a' && href?.startsWith('#'))
			hashes.push(href.slice(1))
		if (node.attrs.commandfor !== undefined) features.commands = true
		if (node.attrs['data-countdown-to'] !== undefined)
			features.countdown = true
		if (node.attrs['data-header'] === 'autohide') features.autohide = true
		if (readReveal(node.attrs) || readStagger(node.attrs))
			features.reveal = true
		if (node.tag.toLowerCase().startsWith('calendar-'))
			features.calendar = true
	})
	features.popupLinks = hashes.some((id) => popups.has(id))
	return features
}

// Code for site.js, only the parts the page uses
export const featureScripts = (features: PageFeatures) => [
	...(features.commands ? [COMMANDS] : []),
	...(features.popupLinks ? [POPUP_LINKS] : []),
	...(features.countdown ? [COUNTDOWN] : []),
	...(features.autohide ? [AUTOHIDE] : []),
	...(features.reveal ? [REVEAL_SCRIPT] : []),
]
