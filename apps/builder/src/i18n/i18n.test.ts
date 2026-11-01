import { describe, expect, it } from 'vitest'
import i18n, { t } from '@/i18n'
import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'

// Plural forms differ per language, so they are compared by their base key
const PLURAL = /_(zero|one|two|few|many|other)$/

const keys = (obj: object, prefix = ''): string[] =>
	Object.entries(obj).flatMap(([key, value]) =>
		typeof value === 'object' && value !== null
			? keys(value, `${prefix}${key}.`)
			: [`${prefix}${key}`.replace(PLURAL, '')]
	)

describe('locales', () => {
	it('ru has exactly the keys of en', () => {
		const a = [...new Set(keys(en))].sort()
		const b = [...new Set(keys(ru))].sort()
		expect(b).toEqual(a)
	})

	it('uses the same {{placeholders}} in both languages', () => {
		const holders = (obj: object, prefix = ''): [string, string[]][] =>
			Object.entries(obj).flatMap(([key, value]) =>
				typeof value === 'object' && value !== null
					? holders(value, `${prefix}${key}.`)
					: [
							[
								`${prefix}${key}`.replace(PLURAL, ''),
								[
									...new Set(
										String(value).match(/\{\{\w+\}\}/g) ??
											[]
									),
								].sort(),
							] as [string, string[]],
						]
			)
		const ruMap = new Map(holders(ru))
		for (const [key, names] of holders(en)) {
			expect(ruMap.get(key), key).toEqual(names)
		}
	})
})

describe('t', () => {
	it('defaults to English under tests', () => {
		expect(i18n.resolvedLanguage).toBe('en')
	})

	it('interpolates {{name}}', () => {
		expect(t('common.addNamed', { name: 'Hero' })).toBe('Add Hero')
	})

	it('picks English plurals', () => {
		expect(t('props.sectionCount', { count: 1 })).toBe('1 section')
		expect(t('props.sectionCount', { count: 2 })).toBe('2 sections')
	})

	it('picks Russian plurals', async () => {
		await i18n.changeLanguage('ru')
		try {
			const form = (count: number) => t('props.sectionCount', { count })
			expect(form(1)).toBe('1 секция')
			expect(form(2)).toBe('2 секции')
			expect(form(5)).toBe('5 секций')
			expect(form(21)).toBe('21 секция')
			expect(form(11)).toBe('11 секций')
		} finally {
			await i18n.changeLanguage('en')
		}
	})
})
