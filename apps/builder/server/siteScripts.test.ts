import { describe, expect, it } from 'vitest'
import { counterIds, parseHtml } from '@ui-system/core'
import { detectFeatures, featureScripts } from './siteScripts'

const features = (html: string) => detectFeatures(parseHtml(html, counterIds()))

describe('popup links', () => {
	const dialog = '<dialog id="hi" class="modal"></dialog>'
	it('is needed for a link to a modal or popover', () => {
		expect(features(`<a href="#hi">x</a>${dialog}`).popupLinks).toBe(true)
		expect(
			features('<a href="#p">x</a><div id="p" popover></div>').popupLinks
		).toBe(true)
	})
	it('is not needed for plain anchors', () => {
		expect(features(`<a href="#other">x</a>${dialog}`).popupLinks).toBe(
			false
		)
		expect(
			features('<a href="#hi">x</a><div id="hi"></div>').popupLinks
		).toBe(false)
	})
	it('adds the script only when used', () => {
		const on = featureScripts(features(`<a href="#hi">x</a>${dialog}`))
		expect(on.join('')).toContain('openPopup')
		expect(featureScripts(features(dialog))).toHaveLength(0)
	})
})

describe('reveal', () => {
	it('is detected from data-reveal or a stagger container', () => {
		expect(features('<p data-reveal="fade">x</p>').reveal).toBe(true)
		expect(
			features(
				'<ul data-reveal-stagger="80" data-reveal-items="zoom"></ul>'
			).reveal
		).toBe(true)
		expect(features('<p data-reveal="spin">x</p>').reveal).toBe(false)
		expect(features('<p>x</p>').reveal).toBe(false)
	})
	it('adds the script only when used', () => {
		expect(
			featureScripts(features('<p data-reveal="fade">x</p>')).join('')
		).toContain('IntersectionObserver')
		expect(featureScripts(features('<p>x</p>'))).toHaveLength(0)
	})
})
