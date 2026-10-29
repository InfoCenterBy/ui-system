import { useCallback, useEffect, useRef, useState } from 'react'
import { UploadIcon } from 'lucide-react'
import { api, type Asset } from '@/api'
import { Button } from '@/components/ui/button'
import { assetUrl } from '@/editor/properties/assetUrl'

interface Props {
	value: string
	onPick: (path: string) => void
}

export function AssetPicker({ value, onPick }: Props) {
	const [images, setImages] = useState<Asset[]>([])
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)
	const input = useRef<HTMLInputElement>(null)

	const load = useCallback(
		() =>
			api
				.assets()
				.then((list) =>
					setImages(list.filter((a) => a.kind === 'image'))
				)
				.catch((e: Error) => setError(e.message)),
		[]
	)

	useEffect(() => {
		void load()
	}, [load])

	const upload = async (file: File) => {
		setBusy(true)
		setError(null)
		try {
			const { path } = await api.upload(file)
			await load()
			onPick(path)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Upload failed')
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className='flex flex-col gap-2'>
			<div className='grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto'>
				{images.map((asset) => (
					<button
						key={asset.path}
						type='button'
						title={asset.name}
						onClick={() => onPick(asset.path)}
						className={`bg-muted aspect-square overflow-hidden rounded-md border-2 ${
							asset.path === value
								? 'border-primary'
								: 'hover:border-border border-transparent'
						}`}
					>
						<img
							src={assetUrl(asset.path)}
							alt={asset.name}
							className='size-full object-cover'
						/>
					</button>
				))}
			</div>
			{images.length === 0 && (
				<p className='text-muted-foreground text-xs'>
					No images in the project yet
				</p>
			)}
			<input
				ref={input}
				type='file'
				accept='image/*'
				className='hidden'
				onChange={(e) => {
					const file = e.target.files?.[0]
					e.target.value = ''
					if (file) void upload(file)
				}}
			/>
			<Button
				size='sm'
				variant='outline'
				disabled={busy}
				onClick={() => input.current?.click()}
			>
				<UploadIcon /> {busy ? 'Uploading' : 'Upload'}
			</Button>
			{error && <p className='text-destructive text-xs'>{error}</p>}
		</div>
	)
}
