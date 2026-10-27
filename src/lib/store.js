import { useSyncExternalStore } from 'react'

// Small shared state, kept in localStorage when a key is given
export const createStore = (key, fallback, isValid = () => true) => {
	const read = () => {
		if (!key) return fallback
		try {
			const raw = localStorage.getItem(key)
			if (raw === null) return fallback
			const value = JSON.parse(raw)
			return isValid(value) ? value : fallback
		} catch {
			return fallback
		}
	}

	let value = read()
	const listeners = new Set()

	const subscribe = (listener) => {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}

	const set = (next) => {
		value = typeof next === 'function' ? next(value) : next
		if (key) {
			try {
				localStorage.setItem(key, JSON.stringify(value))
			} catch {
				// Storage can be blocked, the value still applies for this visit
			}
		}
		listeners.forEach((listener) => listener())
	}

	const get = () => value
	const use = () => useSyncExternalStore(subscribe, get)

	return { get, set, use }
}
