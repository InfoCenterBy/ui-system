import { describe, expect, it } from 'vitest'
import {
	counterIds,
	isElement,
	parseHtml,
	type ElementNode,
} from '@ui-system/core'
import {
	addSlides,
	carouselOf,
	moveSlide,
	removeSlide,
	slideImage,
	slidesOf,
} from './carousel'

const plain = () =>
	parseHtml(
		`<div class="carousel w-full">
			<div class="carousel-item"><img src="a.webp" alt="A"></div>
			<div class="carousel-item"><img src="b.webp" alt="B"></div>
		</div>`,
		counterIds('p')
	) as ElementNode[]

const withButtons = () =>
	parseHtml(
		`<div class="carousel">
			${[1, 2, 3]
				.map(
					(n) => `<div id="s${n}" class="carousel-item relative">
						<img src="${n}.webp">
						<div class="absolute"><a href="#s${n === 1 ? 3 : n - 1}">❮</a><a href="#s${n === 3 ? 1 : n + 1}">❯</a></div>
					</div>`
				)
				.join('')}
		</div>`,
		counterIds('b')
	) as ElementNode[]

const sources = (carousel: ElementNode) =>
	slidesOf(carousel).map((s) => slideImage(s)?.attrs.src)

const arrows = (carousel: ElementNode) =>
	slidesOf(carousel).map((slide) => {
		const links: string[] = []
		const visit = (node: ElementNode) => {
			if (node.attrs.href) links.push(node.attrs.href)
			node.children.filter(isElement).forEach(visit)
		}
		visit(slide)
		return `${slide.attrs.id} ${links.join(' ')}`
	})

describe('carousel slides', () => {
	it('finds the carousel from a picture inside it', () => {
		const roots = plain()
		const image = slideImage(slidesOf(roots[0])[1])!
		expect(carouselOf(roots, image.id)?.id).toBe(roots[0].id)
		expect(carouselOf(roots, 'nope')).toBeNull()
	})

	it('adds photos as copies of the last slide', () => {
		const [carousel] = plain()
		const added = addSlides(carousel, ['c.webp', 'd.webp'], counterIds('x'))
		expect(added).toHaveLength(2)
		expect(sources(carousel)).toEqual([
			'a.webp',
			'b.webp',
			'c.webp',
			'd.webp',
		])
		expect(slideImage(added[0])?.attrs.alt).toBe('')
		expect(carousel.attrs.id).toBeUndefined()
	})

	it('moves and removes slides, keeping the last one', () => {
		const [carousel] = plain()
		const [first, second] = slidesOf(carousel)
		moveSlide(carousel, first.id, 1)
		expect(sources(carousel)).toEqual(['b.webp', 'a.webp'])
		moveSlide(carousel, first.id, 1)
		expect(sources(carousel)).toEqual(['b.webp', 'a.webp'])
		removeSlide(carousel, second.id)
		expect(sources(carousel)).toEqual(['a.webp'])
		expect(() => removeSlide(carousel, first.id)).toThrow(/last slide/)
	})

	it('renumbers slide ids and arrows of linked slides', () => {
		const [carousel] = withButtons()
		addSlides(carousel, ['4.webp'], counterIds('x'))
		const id = (n: number) => `#slide-${carousel.id}-${n}`
		expect(arrows(carousel)).toEqual([
			`${id(1).slice(1)} ${id(4)} ${id(2)}`,
			`${id(2).slice(1)} ${id(1)} ${id(3)}`,
			`${id(3).slice(1)} ${id(2)} ${id(4)}`,
			`${id(4).slice(1)} ${id(3)} ${id(1)}`,
		])
		removeSlide(carousel, slidesOf(carousel)[0].id)
		expect(sources(carousel)).toEqual(['2.webp', '3.webp', '4.webp'])
		expect(arrows(carousel)[0]).toBe(`${id(1).slice(1)} ${id(3)} ${id(2)}`)
	})
})
