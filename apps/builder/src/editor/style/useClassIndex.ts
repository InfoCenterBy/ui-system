import { useEffect, useState } from 'react'
import type { ClassIndex } from '@ui-system/theme/classes'
import { api } from '@/api'

let promise: Promise<ClassIndex> | null = null

const escapeClass = (name: string) => name.replace(/[^\w-]/g, '\\$&')

// Tailwind and the daisyUI component list load once, on first use
const loadIndex = () => {
	promise ??= (async () => {
		const [{ loadClassIndex }, components] = await Promise.all([
			import('@ui-system/theme/classes'),
			// Without the component list only Tailwind classes are suggested
			api.componentClasses().catch(() => []),
		])
		return loadClassIndex(
			components.map(({ name, css }) => ({
				selector: `.${escapeClass(name)}`,
				css,
			}))
		)
	})().catch((error: unknown) => {
		promise = null
		throw error
	})
	return promise
}

export type IndexState =
	| { status: 'loading' }
	| { status: 'ready'; index: ClassIndex }
	| { status: 'error' }

export function useClassIndex(): IndexState {
	const [state, setState] = useState<IndexState>({ status: 'loading' })
	useEffect(() => {
		let active = true
		loadIndex().then(
			(index) => active && setState({ status: 'ready', index }),
			() => active && setState({ status: 'error' })
		)
		return () => {
			active = false
		}
	}, [])
	return state
}
