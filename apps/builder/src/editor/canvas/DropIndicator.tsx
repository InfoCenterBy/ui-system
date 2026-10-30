import type { Rect } from '@/editor/canvas/dropTarget'
import type { useCanvasDrop } from '@/editor/canvas/useCanvasDrop'

// Insertion line along the edge of a sibling, the rect has no width or no height
function Line({ rect, scale }: { rect: Rect; scale: number }) {
	const t = 3 / scale
	const vertical = rect.right === rect.left
	return (
		<div
			className='pointer-events-none absolute bg-blue-500'
			style={{
				left: vertical ? rect.left - t / 2 : rect.left,
				top: vertical ? rect.top : rect.top - t / 2,
				width: vertical ? t : rect.right - rect.left,
				height: vertical ? rect.bottom - rect.top : t,
			}}
		/>
	)
}

// Takes the drag events over the iframe and draws the insertion line
export function DropIndicator({
	drop,
	scale,
}: {
	drop: ReturnType<typeof useCanvasDrop>
	scale: number
}) {
	const { ref, active, view } = drop
	return (
		<div
			ref={ref}
			className='absolute inset-0 overflow-hidden'
			style={{ pointerEvents: active ? 'auto' : 'none' }}
		>
			{active && view?.kind === 'section' && (
				<div
					className='pointer-events-none absolute right-0 left-0 bg-blue-500'
					style={{ top: view.y - 1.5 / scale, height: 3 / scale }}
				/>
			)}
			{active && view?.kind === 'inside' && (
				<>
					{view.outline && (
						<div
							className='pointer-events-none absolute bg-blue-500/5 outline-blue-500 outline-solid'
							style={{
								left: view.outline.left,
								top: view.outline.top,
								width: view.outline.right - view.outline.left,
								height: view.outline.bottom - view.outline.top,
								outlineWidth: 2 / scale,
								outlineOffset: -1 / scale,
							}}
						/>
					)}
					{view.line && <Line rect={view.line} scale={scale} />}
				</>
			)}
			{active && view?.kind === 'blocked' && (
				<span
					className='pointer-events-none absolute rounded-full bg-neutral-900 px-2.5 py-1 font-sans font-medium whitespace-nowrap text-white shadow'
					style={{
						left: view.x + 14 / scale,
						top: view.y + 14 / scale,
						fontSize: 12 / scale,
					}}
				>
					{view.message}
				</span>
			)}
		</div>
	)
}
