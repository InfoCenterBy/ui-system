import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp, { type Metadata } from 'sharp'

export interface ImageVariant {
	// File name inside outDir
	file: string
	width: number
}

export interface OptimizedImage {
	width: number
	height: number
	// Ascending by width, the last one is the largest
	variants: ImageVariant[]
}

const DEFAULT_WIDTHS = [480, 960, 1440, 1920]
const RASTER_FORMATS = new Set(['png', 'jpeg', 'webp', 'heif', 'avif'])

// Raster images become WebP in a few widths, SVG and GIF return null and are copied as they are by the caller
export async function optimizeImage(
	input: string,
	outDir: string,
	baseName: string,
	options: { widths?: number[]; quality?: number } = {}
): Promise<OptimizedImage | null> {
	const inputStat = await stat(input)
	const widths = options.widths ?? DEFAULT_WIDTHS
	const quality = options.quality ?? 80

	let meta: Metadata
	try {
		meta = await sharp(input).metadata()
	} catch {
		return null
	}
	if (
		!meta.format ||
		!RASTER_FORMATS.has(meta.format) ||
		!meta.width ||
		!meta.height
	)
		return null

	// EXIF orientation 5-8 swaps the sides
	const swapped = (meta.orientation ?? 1) >= 5
	const srcWidth = swapped ? meta.height : meta.width
	const srcHeight = swapped ? meta.width : meta.height

	const maxWidth = Math.min(srcWidth, Math.max(...widths))
	const targets = [
		...new Set([...widths.filter((w) => w < maxWidth), maxWidth]),
	].sort((a, b) => a - b)

	await mkdir(outDir, { recursive: true })

	const variants: ImageVariant[] = []
	for (const width of targets) {
		const file = `${baseName}-${width}.webp`
		const outPath = join(outDir, file)
		if (!(await isFresh(outPath, inputStat.mtimeMs))) {
			await sharp(input)
				.rotate()
				.resize({ width, withoutEnlargement: true })
				.webp({ quality })
				.toFile(outPath)
		}
		variants.push({ file, width })
	}

	const largest = variants[variants.length - 1]
	const height = Math.max(
		1,
		Math.round((srcHeight * largest.width) / srcWidth)
	)
	return { width: largest.width, height, variants }
}

async function isFresh(
	outPath: string,
	inputMtimeMs: number
): Promise<boolean> {
	try {
		return (await stat(outPath)).mtimeMs >= inputMtimeMs
	} catch {
		return false
	}
}
