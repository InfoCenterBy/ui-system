import { useRef, useState } from 'react'
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ImagePlusIcon,
	Trash2Icon,
	UploadIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ElementNode } from '@ui-system/core'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/editor/properties/AssetPicker'
import { assetUrl } from '@/editor/properties/assetUrl'
import { useTranslation } from 'react-i18next'
import {
	addCarouselSlides,
	moveCarouselSlide,
	removeCarouselSlide,
} from '@/store/actions'
import { slideImage, slidesOf } from '@/store/carousel'
import { useProject } from '@/store/project'

function IconButton({
	label,
	disabled,
	onClick,
	children,
}: {
	label: string
	disabled?: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<Button
			size='icon-sm'
			variant='ghost'
			title={label}
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
		</Button>
	)
}

// Slide list of a carousel: pick, reorder, remove and add photos as new slides
export function CarouselProperties({ carousel }: { carousel: ElementNode }) {
	const { t } = useTranslation()
	const select = useProject((s) => s.select)
	const selectedId = useProject((s) => s.selectedId)
	const [busy, setBusy] = useState(false)
	const [library, setLibrary] = useState(false)
	// Remounts the picker so it lists files uploaded here
	const [uploads, setUploads] = useState(0)
	const input = useRef<HTMLInputElement>(null)
	const slides = slidesOf(carousel)

	const upload = async (files: File[]) => {
		setBusy(true)
		try {
			const paths: string[] = []
			for (const file of files) paths.push((await api.upload(file)).path)
			addCarouselSlides(carousel.id, paths)
			setUploads((n) => n + 1)
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : t('assets.uploadFailed')
			)
		} finally {
			setBusy(false)
		}
	}

	return (
		<section className='flex flex-col gap-2'>
			<h3 className='text-xs font-medium'>
				{t('carousel.title', { count: slides.length })}
			</h3>
			<ul className='flex flex-col gap-1'>
				{slides.map((slide, i) => {
					const image = slideImage(slide)
					const src = image?.attrs.src
					const current =
						selectedId === slide.id || selectedId === image?.id
					return (
						<li
							key={slide.id}
							className={`flex items-center gap-1.5 rounded-md border p-1 ${current ? 'border-primary' : ''}`}
						>
							<button
								type='button'
								className='flex min-w-0 flex-1 items-center gap-2 text-left text-xs'
								onClick={() => select(image?.id ?? slide.id)}
							>
								<span className='bg-muted h-9 w-12 shrink-0 overflow-hidden rounded'>
									{src && (
										<img
											src={assetUrl(src)}
											alt=''
											className='size-full object-cover'
										/>
									)}
								</span>
								<span className='truncate'>
									{t('carousel.slide', { n: i + 1 })}
								</span>
							</button>
							<IconButton
								label={t('common.moveUp')}
								disabled={i === 0}
								onClick={() =>
									moveCarouselSlide(carousel.id, slide.id, -1)
								}
							>
								<ArrowUpIcon />
							</IconButton>
							<IconButton
								label={t('common.moveDown')}
								disabled={i === slides.length - 1}
								onClick={() =>
									moveCarouselSlide(carousel.id, slide.id, 1)
								}
							>
								<ArrowDownIcon />
							</IconButton>
							<IconButton
								label={t('common.remove')}
								disabled={slides.length <= 1}
								onClick={() =>
									removeCarouselSlide(carousel.id, slide.id)
								}
							>
								<Trash2Icon />
							</IconButton>
						</li>
					)
				})}
			</ul>
			<input
				ref={input}
				type='file'
				accept='image/*'
				multiple
				className='hidden'
				onChange={(e) => {
					const files = [...(e.target.files ?? [])]
					e.target.value = ''
					if (files.length) void upload(files)
				}}
			/>
			<div className='flex flex-wrap gap-1'>
				<Button
					size='sm'
					variant='outline'
					disabled={busy || slides.length === 0}
					onClick={() => input.current?.click()}
				>
					<UploadIcon />
					{busy ? t('assets.uploading') : t('carousel.addPhotos')}
				</Button>
				<Button
					size='sm'
					variant={library ? 'secondary' : 'outline'}
					disabled={slides.length === 0}
					aria-pressed={library}
					onClick={() => setLibrary(!library)}
				>
					<ImagePlusIcon />
					{t('carousel.fromLibrary')}
				</Button>
			</div>
			{library && (
				<AssetPicker
					key={uploads}
					value=''
					onPick={(path) => addCarouselSlides(carousel.id, [path])}
				/>
			)}
			<p className='text-muted-foreground text-xs'>
				{t('carousel.hint')}
			</p>
		</section>
	)
}
