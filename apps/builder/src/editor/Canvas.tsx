import { useProject } from '@/store/project'

export function Canvas() {
	const width = useProject((s) => s.canvasWidth)
	return (
		<div className='bg-muted h-full overflow-auto p-6'>
			<div
				className='mx-auto min-h-full bg-white shadow-sm'
				style={{ width, maxWidth: '100%' }}
			>
				<p className='p-6 text-sm text-neutral-500'>{width}px</p>
			</div>
		</div>
	)
}
