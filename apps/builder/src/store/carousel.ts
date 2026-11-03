import {
	ancestorsOf,
	cloneNode,
	findElement,
	isElement,
	walk,
	type ElementNode,
	type IdFactory,
	type NodeId,
	type TreeNode,
} from '@ui-system/core'

const hasClass = (node: ElementNode, name: string) =>
	node.classes.split(/\s+/).includes(name)

// The carousel a node is or sits in
export const carouselOf = (roots: TreeNode[], id: NodeId) => {
	const node = findElement(roots, id)
	if (!node) return null
	if (hasClass(node, 'carousel')) return node
	return (
		ancestorsOf(roots, id).findLast((a) => hasClass(a, 'carousel')) ?? null
	)
}

export const slidesOf = (carousel: ElementNode) =>
	carousel.children.filter(
		(c): c is ElementNode => isElement(c) && hasClass(c, 'carousel-item')
	)

export const slideImage = (slide: ElementNode) => {
	let found: ElementNode | null = null
	walk([slide], (node) => {
		if (found) return false
		if (isElement(node) && node.tag.toLowerCase() === 'img') found = node
	})
	return found as ElementNode | null
}

const hashLinks = (slide: ElementNode) => {
	const links: ElementNode[] = []
	walk(slide.children, (node) => {
		if (isElement(node) && node.attrs.href?.startsWith('#'))
			links.push(node)
	})
	return links
}

// Slides addressed by id keep their ids and prev/next links in order:
// slide i gets id <carousel>-i, its first link points back, the last one forward
export const renumberSlides = (carousel: ElementNode) => {
	const slides = slidesOf(carousel)
	if (!slides.some((s) => s.attrs.id)) return
	const idAt = (i: number) =>
		`slide-${carousel.id}-${((i + slides.length) % slides.length) + 1}`
	slides.forEach((slide, i) => {
		slide.attrs.id = idAt(i)
		const links = hashLinks(slide)
		if (links.length < 2) return
		links[0].attrs.href = `#${idAt(i - 1)}`
		links[links.length - 1].attrs.href = `#${idAt(i + 1)}`
	})
}

// New slides copy the last one with another picture
export const addSlides = (
	carousel: ElementNode,
	sources: string[],
	newId: IdFactory
) => {
	const slides = slidesOf(carousel)
	const template = slides.at(-1)
	if (!template) throw new Error('The carousel has no slide to copy')
	let at = carousel.children.indexOf(template) + 1
	const added: ElementNode[] = []
	for (const src of sources) {
		const slide = cloneNode(template, newId)
		const image = slideImage(slide)
		if (image) {
			image.attrs.src = src
			image.attrs.alt = ''
			delete image.attrs.srcset
		}
		carousel.children.splice(at++, 0, slide)
		added.push(slide)
	}
	renumberSlides(carousel)
	return added
}

// The last slide stays, new ones are copied from it
export const removeSlide = (carousel: ElementNode, slideId: NodeId) => {
	const slides = slidesOf(carousel)
	if (slides.length <= 1) throw new Error('The last slide cannot be removed')
	const index = carousel.children.findIndex((c) => c.id === slideId)
	if (index < 0) throw new Error(`No slide with id ${slideId}`)
	carousel.children.splice(index, 1)
	renumberSlides(carousel)
}

export const moveSlide = (
	carousel: ElementNode,
	slideId: NodeId,
	step: -1 | 1
) => {
	const slides = slidesOf(carousel)
	const position = slides.findIndex((s) => s.id === slideId)
	const neighbour = slides[position + step]
	if (position < 0 || !neighbour) return
	const from = carousel.children.indexOf(slides[position])
	const [slide] = carousel.children.splice(from, 1)
	carousel.children.splice(
		carousel.children.indexOf(neighbour) + (step > 0 ? 1 : 0),
		0,
		slide
	)
	renumberSlides(carousel)
}
