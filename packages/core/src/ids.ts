import type { NodeId } from './types'

export type IdFactory = () => NodeId

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

// Short random ids, 10 chars give plenty of room for one site
export const randomId: IdFactory = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(10))
	return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

// Predictable ids for tests
export const counterIds = (prefix = 'n'): IdFactory => {
	let count = 0
	return () => `${prefix}${++count}`
}
