import { useEffect, useState } from 'react'
import type { ClassIndex } from '@ui-system/theme/classes'
import { api } from '@/api'

let promise: Promise<ClassIndex> | null = null

// Tailwind and the daisyUI component list load once, on first use
const loadIndex = () => {
	promise ??= (async () => {
		const [{ loadClassIndex }, components] = await Promise.all([
			import('@ui-system/theme/classes'),
			// Without the component list only Tailwind classes are suggested
			api.componentClasses().catch(() => []),
		])
		// Previews are finished rule blocks, so they bypass the rule parsing
		return loadClassIndex([], components)
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
