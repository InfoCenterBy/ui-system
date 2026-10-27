import { useSyncExternalStore } from 'react'

const KEY = 'code-format'
const FORMATS = ['html', 'jsx']

const read = () => {
	try {
		const saved = localStorage.getItem(KEY)
		return FORMATS.includes(saved) ? saved : 'html'
	} catch {
		return 'html'
	}
}

let format = read()
const listeners = new Set()

const subscribe = (listener) => {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export const setCodeFormat = (value) => {
	format = value
	try {
		localStorage.setItem(KEY, value)
	} catch {
		// Storage can be blocked, the choice still applies for this visit
	}
	listeners.forEach((listener) => listener())
}

// Shared HTML or JSX choice for every code block
export const useCodeFormat = () => useSyncExternalStore(subscribe, () => format)
