// OKLCH helpers for daisyUI theme colors, based on the OKLab reference matrices

const round = (value, digits) => Number(value.toFixed(digits))

export const parseOklch = (value) => {
	const match = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i.exec(value)
	if (!match) return null
	const l = Number(match[1]) / (match[2] ? 100 : 1)
	return { l, c: Number(match[3]), h: Number(match[4]) }
}

export const formatOklch = ({ l, c, h }) =>
	`oklch(${round(l * 100, 2)}% ${round(c, 3)} ${round(c < 0.0005 ? 0 : h, 3)})`

const oklchToLinearRgb = ({ l, c, h }) => {
	const rad = (h * Math.PI) / 180
	const a = c * Math.cos(rad)
	const b = c * Math.sin(rad)
	const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
	const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
	const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
	return [
		4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
		-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
		-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
	]
}

const linearRgbToOklch = ([r, g, b]) => {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
	const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	const h = (Math.atan2(B, A) * 180) / Math.PI
	return { l: L, c: Math.hypot(A, B), h: (h + 360) % 360 }
}

const toGamma = (x) =>
	x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
const toLinear = (x) =>
	x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4

const inGamut = (rgb) => rgb.every((x) => x >= -0.0001 && x <= 1.0001)

// Lowers chroma until the color fits sRGB, keeps lightness and hue
const toSrgbGamut = (color) => {
	if (inGamut(oklchToLinearRgb(color))) return color
	let low = 0
	let high = color.c
	for (let i = 0; i < 20; i++) {
		const mid = (low + high) / 2
		if (inGamut(oklchToLinearRgb({ ...color, c: mid }))) low = mid
		else high = mid
	}
	return { ...color, c: low }
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))

export const oklchToHex = (value) => {
	const color = typeof value === 'string' ? parseOklch(value) : value
	if (!color) return '#000000'
	return (
		'#' +
		oklchToLinearRgb(toSrgbGamut(color))
			.map((x) =>
				Math.round(clamp01(toGamma(clamp01(x))) * 255)
					.toString(16)
					.padStart(2, '0')
			)
			.join('')
	)
}

export const hexToOklch = (hex) => {
	const rgb = hex
		.replace('#', '')
		.match(/../g)
		.map((x) => toLinear(parseInt(x, 16) / 255))
	return formatOklch(linearRgbToOklch(rgb))
}

const luminance = (color) => {
	const [r, g, b] = oklchToLinearRgb(toSrgbGamut(color)).map(clamp01)
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrastRatio = (a, b) => {
	const la = luminance(typeof a === 'string' ? parseOklch(a) : a)
	const lb = luminance(typeof b === 'string' ? parseOklch(b) : b)
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const MIN_CONTRAST = 4.5

// Readable text color in the same hue, like the daisyUI themes do
export const autoContent = (value) => {
	const bg = parseOklch(value)
	if (!bg) return value
	const darkText =
		contrastRatio(bg, { l: 0, c: 0, h: 0 }) >=
		contrastRatio(bg, { l: 1, c: 0, h: 0 })
	const step = darkText ? -0.02 : 0.02
	const text = {
		l: darkText ? Math.max(bg.l - 0.45, 0.05) : Math.min(bg.l + 0.5, 0.98),
		c: bg.c * 0.35,
		h: bg.h,
	}
	while (contrastRatio(bg, text) < MIN_CONTRAST && text.l > 0 && text.l < 1) {
		text.l = clamp01(text.l + step)
		text.c *= 0.9
	}
	return formatOklch(text)
}

export const isReadable = (bg, text) => contrastRatio(bg, text) >= MIN_CONTRAST
