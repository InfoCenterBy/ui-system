import { describe, expect, it } from 'vitest'
import { movedEnough, shouldHide } from './autohide'

describe('canvas autohide', () => {
	it('hides when scrolling down past the header', () => {
		expect(shouldHide(100, 300, 80, false)).toBe(true)
	})
	it('shows when scrolling up or still inside the header height', () => {
		expect(shouldHide(300, 100, 80, false)).toBe(false)
		expect(shouldHide(10, 40, 80, false)).toBe(false)
	})
	it('never hides while kept visible', () => {
		expect(shouldHide(100, 300, 80, true)).toBe(false)
	})
	it('ignores tiny moves', () => {
		expect(movedEnough(100, 104)).toBe(false)
		expect(movedEnough(100, 120)).toBe(true)
	})
})
