import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { optimizeImage } from './images'

sharp.cache(false)

let dir: string
let out: string

beforeAll(async () => {
	dir = await mkdtemp(join(tmpdir(), 'builder-images-'))
	out = join(dir, 'out')
})

afterAll(async () => {
	await rm(dir, {
		recursive: true,
		force: true,
		maxRetries: 10,
		retryDelay: 100,
	})
})

function blank(width: number, height: number) {
	return sharp({
		create: { width, height, channels: 3, background: '#3366cc' },
	})
}

describe('optimizeImage', () => {
	it('makes four widths for a large png and keeps the ratio', async () => {
		const input = join(dir, 'big.png')
		await blank(2000, 1000).png().toFile(input)
		const result = await optimizeImage(input, out, 'big')
		expect(result?.variants.map((v) => v.width)).toEqual([
			480, 960, 1440, 1920,
		])
		expect(result?.variants.map((v) => v.file)).toEqual([
			'big-480.webp',
			'big-960.webp',
			'big-1440.webp',
			'big-1920.webp',
		])
		expect(result).toMatchObject({ width: 1920, height: 960 })
		for (const v of result!.variants) {
			const meta = await sharp(join(out, v.file)).metadata()
			expect(meta.format).toBe('webp')
			expect(meta.width).toBe(v.width)
			expect(meta.height).toBe(v.width / 2)
		}
	})

	it('does not upscale a small jpg', async () => {
		const input = join(dir, 'small.jpg')
		await blank(600, 400).jpeg().toFile(input)
		const result = await optimizeImage(input, out, 'small')
		expect(result?.variants.map((v) => v.width)).toEqual([480, 600])
		expect(result).toMatchObject({ width: 600, height: 400 })
	})

	it('returns null for svg', async () => {
		const input = join(dir, 'a.svg')
		await writeFile(
			input,
			'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
		)
		expect(await optimizeImage(input, out, 'a')).toBeNull()
	})

	it('returns null for gif', async () => {
		const input = join(dir, 'a.gif')
		await blank(20, 20).gif().toFile(input)
		expect(await optimizeImage(input, out, 'agif')).toBeNull()
	})

	it('returns null for a file sharp cannot read', async () => {
		const input = join(dir, 'broken.png')
		await writeFile(input, 'not an image')
		expect(await optimizeImage(input, out, 'broken')).toBeNull()
	})

	it('throws for a missing file', async () => {
		await expect(
			optimizeImage(join(dir, 'nope.png'), out, 'nope')
		).rejects.toThrow()
	})

	it('reuses files on the second call', async () => {
		const input = join(dir, 'cache.png')
		await blank(1000, 500).png().toFile(input)
		const first = await optimizeImage(input, out, 'cache')
		const before = await Promise.all(
			first!.variants.map(
				async (v) => (await stat(join(out, v.file))).mtimeMs
			)
		)
		const second = await optimizeImage(input, out, 'cache')
		const after = await Promise.all(
			second!.variants.map(
				async (v) => (await stat(join(out, v.file))).mtimeMs
			)
		)
		expect(after).toEqual(before)
		expect(second).toEqual(first)
	})

	it('reports swapped dimensions for a rotated jpeg', async () => {
		const input = join(dir, 'rotated.jpg')
		await blank(600, 400)
			.jpeg()
			.withMetadata({ orientation: 6 })
			.toFile(input)
		const result = await optimizeImage(input, out, 'rotated')
		expect(result).toMatchObject({ width: 400, height: 600 })
		const meta = await sharp(join(out, 'rotated-400.webp')).metadata()
		expect([meta.width, meta.height]).toEqual([400, 600])
	})
})
