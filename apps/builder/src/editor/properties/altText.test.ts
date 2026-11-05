import { describe, expect, it } from 'vitest'
import { altFromFileName } from './altText'

describe('altFromFileName', () => {
	it('turns word file names into a sentence', () => {
		expect(altFromFileName('team-at-work.jpg')).toBe('Team at work')
		expect(altFromFileName('red_bicycle_in_park.PNG')).toBe(
			'Red bicycle in park'
		)
		expect(altFromFileName('Офис команды.webp')).toBe('Офис команды')
	})
	it('skips camera, numbered and hash names', () => {
		for (const name of [
			'IMG_1234.jpg',
			'DSC0001.JPG',
			'Screenshot 2026-11-05 at 10.12.png',
			'a1b2c3d4e5f6.png',
			'8f14e45fceea167a5a36dedd4bea2543.jpg',
			'photo (3).jpg',
			'1.png',
		]) {
			expect(altFromFileName(name)).toBe('')
		}
	})
})
