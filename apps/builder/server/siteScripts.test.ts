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
