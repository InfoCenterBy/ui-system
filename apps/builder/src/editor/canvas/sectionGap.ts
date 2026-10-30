export interface Span {
	top: number
	bottom: number
}

// Insertion index among stacked sections for a height, and the line to draw
export const gapAt = (spans: Span[], y: number) => {
	let index = 0
	while (index < spans.length) {
		const s = spans[index]
		if (y < s.top + (s.bottom - s.top) / 2) break
		index++
	}
	const line =
		index < spans.length
			? spans[index].top
			: spans.length > 0
				? spans[spans.length - 1].bottom
				: 0
	return { index, y: line }
}
