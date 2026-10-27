const DURATION = 2000

let toasts = []
let nextId = 0
const listeners = new Set()

const emit = () => listeners.forEach((listener) => listener())

const dismiss = (id) => {
	toasts = toasts.filter((t) => t.id !== id)
	emit()
}

const push = (type, message) => {
	const id = ++nextId
	toasts = [...toasts, { id, type, message }].slice(-4)
	emit()
	setTimeout(() => dismiss(id), DURATION)
}

export const toast = {
	success: (message) => push('success', message),
	error: (message) => push('error', message),
}

export const subscribeToasts = (listener) => {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export const getToasts = () => toasts

export const copyText = async (text, label) => {
	try {
		await navigator.clipboard.writeText(text)
		toast.success(`${label} copied`)
	} catch {
		toast.error(`${label} not copied`)
	}
}
