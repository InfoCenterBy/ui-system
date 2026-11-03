import { hexToOklch, parseOklch } from '@ui-system/theme'

const byte = (x: number) => Math.min(255, Math.max(0, Math.round(x)))
const hex2 = (x: number) => byte(x).toString(16).padStart(2, '0')
const toHex = (r: number, g: number, b: number) =>
	`#${hex2(r)}${hex2(g)}${hex2(b)}`

// Number or percentage of a 0..255 channel
const channel = (text: string) =>
	text.endsWith('%') ? (parseFloat(text) / 100) * 255 : parseFloat(text)

const hslToRgb = (
	h: number,
	s: number,
	l: number
): [number, number, number] => {
	const f = (n: number) => {
		const k = (n + h / 30) % 12
		return (
			l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1))
		)
	}
	return [f(0) * 255, f(8) * 255, f(4) * 255]
}

const FN = /^(rgba?|hsla?)\(\s*([^)]+)\)$/i

// Any typed color (oklch, hex, rgb, hsl) as an OKLCH string, null when it is not one
export const toOklchString = (input: string): string | null => {
	const text = input.trim()
	if (parseOklch(text)) return text
	const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(text)
	if (hex) {
		const full =
			hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1]
		return hexToOklch(`#${full}`)
	}
	const fn = FN.exec(text)
	if (!fn) return null
	// Separators: commas, spaces, or a slash before alpha
	const parts = fn[2]
		.split(/[\s,/]+/)
		.filter(Boolean)
		.slice(0, 3)
	if (parts.length !== 3 || !parts.every((p) => /^-?[\d.]+(%|deg)?$/.test(p)))
		return null
	if (fn[1].toLowerCase().startsWith('rgb')) {
		const [r, g, b] = parts.map(channel)
		return hexToOklch(toHex(r, g, b))
	}
	const [r, g, b] = hslToRgb(
		((parseFloat(parts[0]) % 360) + 360) % 360,
		Math.min(1, Math.max(0, parseFloat(parts[1]) / 100)),
		Math.min(1, Math.max(0, parseFloat(parts[2]) / 100))
	)
	return hexToOklch(toHex(r, g, b))
}
