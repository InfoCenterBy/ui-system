import { describe, expect, it } from 'vitest'
import { parseHtml } from './html'
import { counterIds } from './ids'
import {
	collectReveals,
	readRevealConfig,
	revealCss,
	staggerDelay,
	REVEAL_SCRIPT,
	usesReveal,
	writeRevealConfig,
} from './reveal'

const none = {
	type: null,
	stagger: null,
	duration: 600,
	delay: 0,
	repeat: false,
}

describe('reveal attributes', () => {
	it('writes only what differs from the defaults', () => {
		expect(
			writeRevealConfig({ id: 'a' }, { ...none, type: 'from-bottom' })
		).toEqual({ id: 'a', 'data-reveal': 'from-bottom' })
		expect(
			writeRevealConfig(
				{},
				{
					...none,
					type: 'zoom',
					duration: 900,
					delay: 200,
					repeat: true,
				}
			)
		).toEqual({
			'data-reveal': 'zoom',
			'data-reveal-duration': '900',
			'data-reveal-delay': '200',
			'data-reveal-repeat': '',
		})
	})

	it('reads back what it wrote', () => {
		const config = {
			type: 'fade' as const,
			stagger: { type: 'from-left' as const, step: 80 },
			duration: 400,
			delay: 100,
			repeat: true,
		}
		expect(readRevealConfig(writeRevealConfig({}, config))).toEqual(config)
	})

	it('removes everything and keeps other attributes in order', () => {
		const attrs = {
			id: 'x',
			'data-reveal': 'fade',
			'data-reveal-delay': '300',
			title: 't',
		}
		expect(writeRevealConfig(attrs, none)).toEqual({ id: 'x', title: 't' })
		expect(Object.keys(writeRevealConfig(attrs, none))).toEqual([
			'id',
			'title',
		])
	})

	it('ignores unknown types and clamps numbers', () => {
		expect(readRevealConfig({ 'data-reveal': 'spin' }).type).toBeNull()
		const config = readRevealConfig({
			'data-reveal': 'fade',
			'data-reveal-duration': '999999',
			'data-reveal-delay': '-5',
		})
		expect(config.duration).toBe(5000)
		expect(config.delay).toBe(0)
	})

	it('survives the HTML round trip and is collected in page order', () => {
		const found = collectReveals(
			parseHtml(
				'<section data-reveal="fade"><ul data-reveal-stagger="100" data-reveal-items="from-top"><li>a</li></ul><p data-reveal="zoom" data-reveal-repeat>b</p></section>',
				counterIds()
			)
		)
		expect(usesReveal(parseHtml('<p>x</p>', counterIds()))).toBe(false)
		expect(found.map((e) => e.node.tag)).toEqual(['section', 'ul', 'p'])
		expect(found[1].stagger).toEqual({ type: 'from-top', step: 100 })
		expect(found[2].reveal?.repeat).toBe(true)
	})

	it('steps the delay per child', () => {
		expect(staggerDelay(200, 100, 3)).toBe(500)
	})

	it('hides only after the script marked the page and not for reduced motion', () => {
		const css = revealCss()
		expect(css).toContain('prefers-reduced-motion:no-preference')
		expect(css).not.toMatch(/(^|\n)\[data-reveal/)
		expect(css).toContain(
			'.reveal-js [data-reveal]:not(.is-revealed){opacity:0}'
		)
	})

	it('ships a script that parses', () => {
		expect(() => new Function(REVEAL_SCRIPT)).not.toThrow()
	})
})
