import { useSyncExternalStore } from 'react'
import { getToasts, subscribeToasts } from '../../lib/toast'

const ALERT_CLASS = {
	success: 'alert-success',
	error: 'alert-error',
}

const Toaster = () => {
	const toasts = useSyncExternalStore(subscribeToasts, getToasts)
	if (toasts.length === 0) return null

	return (
		<div className='toast toast-end toast-top z-50' aria-live='polite'>
			{toasts.map((t) => (
				<div
					key={t.id}
					role='status'
					className={`alert alert-soft ${ALERT_CLASS[t.type]} animate-toast-in py-2 text-sm`}
				>
					{t.message}
				</div>
			))}
		</div>
	)
}

export default Toaster
