import type { useCanvasDrop } from '@/editor/canvas/useCanvasDrop'

// Takes the drag events over the iframe and draws the insertion line
export function DropIndicator({
	drop,
	scale,
}: {
	drop: ReturnType<typeof useCanvasDrop>
	scale: number
}) {
	const { ref, active, point } = drop
	return (
		<div
			ref={ref}
			className='absolute inset-0 overflow-hidden'
			style={{ pointerEvents: active ? 'auto' : 'none' }}
		>
			{active && point && (
				<div
					className='pointer-events-none absolute right-0 left-0 bg-blue-500'
					style={{
						top: point.y - 1.5 / scale,
						height: 3 / scale,
					}}
				/>
			)}
		</div>
	)
}
