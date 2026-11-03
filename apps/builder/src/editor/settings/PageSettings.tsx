import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AssetPicker } from '@/editor/properties/AssetPicker'
import { Field } from '@/editor/properties/Field'
import { CodeFields } from '@/editor/settings/CodeFields'
import { assetUrl } from '@/editor/properties/assetUrl'
import { useDocument } from '@/store/document'
import {
	HOME_SLUG,
	renamePage,
	setPageCode,
	setPageFlags,
	setPageSlug,
	updatePageMeta,
} from '@/store/pageActions'
import { useTranslation } from 'react-i18next'

const DESCRIPTION_LIMIT = 160

function Form({ id }: { id: string }) {
	const { t } = useTranslation()
	const page = useDocument((s) => s.doc?.pages[id])
	const [name, setName] = useState(page?.name ?? '')
	const [slug, setSlug] = useState(page?.slug ?? '')
	const [slugError, setSlugError] = useState<string | null>(null)
	if (!page) return null
	const home = page.slug === HOME_SLUG

	const commitSlug = () => {
		if (home || slug === page.slug) return setSlugError(null)
		const error = setPageSlug(id, slug.trim())
		setSlugError(error)
		if (error === null) setSlug(slug.trim())
	}

	return (
		<div className='flex flex-col gap-3 overflow-y-auto p-1'>
			<Field label={t('pageSettings.name')}>
				<Input
					value={name}
					onChange={(e) => {
						setName(e.target.value)
						renamePage(id, e.target.value)
					}}
				/>
			</Field>
			<Field label={t('pageSettings.file')}>
				<div className='flex items-center gap-1.5'>
					<Input
						value={home ? HOME_SLUG : slug}
						disabled={home}
						aria-invalid={slugError !== null}
						onChange={(e) => setSlug(e.target.value)}
						onBlur={commitSlug}
						onKeyDown={(e) => e.key === 'Enter' && commitSlug()}
					/>
					<span className='text-muted-foreground text-sm'>.html</span>
				</div>
				{slugError && (
					<span className='text-destructive text-xs'>
						{slugError}
					</span>
				)}
				{home && (
					<span className='text-muted-foreground text-xs'>
						{t('pageSettings.homeNote')}
					</span>
				)}
			</Field>
			<Field label={t('pageSettings.seoTitle')}>
				<Input
					value={page.meta.title}
					onChange={(e) =>
						updatePageMeta(id, { title: e.target.value })
					}
				/>
			</Field>
			<Field label={t('pageSettings.seoDescription')}>
				<textarea
					rows={3}
					value={page.meta.description}
					onChange={(e) =>
						updatePageMeta(id, { description: e.target.value })
					}
					className='border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border px-2.5 py-1.5 text-sm outline-none focus-visible:ring-3'
				/>
				<span
					className={`text-xs ${
						page.meta.description.length > DESCRIPTION_LIMIT
							? 'text-destructive'
							: 'text-muted-foreground'
					}`}
				>
					{t('pageSettings.recommended', {
						n: page.meta.description.length,
						max: DESCRIPTION_LIMIT,
					})}
				</span>
			</Field>
			<div className='flex flex-col gap-1.5 text-sm'>
				<span className='text-muted-foreground text-xs'>og:image</span>
				{page.meta.ogImage && (
					<div className='flex items-center gap-2'>
						<img
							src={assetUrl(page.meta.ogImage)}
							alt=''
							className='bg-muted h-12 w-20 rounded-md object-cover'
						/>
						<span className='min-w-0 flex-1 truncate text-xs'>
							{page.meta.ogImage}
						</span>
						<Button
							size='icon-sm'
							variant='ghost'
							aria-label={t('pageSettings.clearImage')}
							onClick={() =>
								updatePageMeta(id, { ogImage: null })
							}
						>
							<XIcon />
						</Button>
					</div>
				)}
				<AssetPicker
					value={page.meta.ogImage ?? ''}
					onPick={(path) => updatePageMeta(id, { ogImage: path })}
				/>
			</div>
			<label className='flex items-center gap-2 text-sm'>
				<Switch
					checked={!!page.meta.noindex}
					onCheckedChange={(checked) =>
						updatePageMeta(id, { noindex: checked })
					}
				/>
				{t('seo.noindex')}
			</label>
			<div className='flex gap-6 text-sm'>
				<label className='flex items-center gap-2'>
					<input
						type='checkbox'
						checked={page.showHeader}
						onChange={(e) =>
							setPageFlags(id, { showHeader: e.target.checked })
						}
					/>
					{t('pageSettings.showHeader')}
				</label>
				<label className='flex items-center gap-2'>
					<input
						type='checkbox'
						checked={page.showFooter}
						onChange={(e) =>
							setPageFlags(id, { showFooter: e.target.checked })
						}
					/>
					{t('pageSettings.showFooter')}
				</label>
			</div>
			<CodeFields
				value={page.code}
				onChange={(code) => setPageCode(id, code)}
			/>
		</div>
	)
}

// Name, file name, SEO and header/footer of one page
export function PageSettings({
	pageId,
	open,
	onOpenChange,
}: {
	pageId: string | null
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const { t } = useTranslation()
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[85svh] flex-col sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>{t('top.pageSettingsTitle')}</DialogTitle>
					<DialogDescription>
						{t('pageSettings.note')}
					</DialogDescription>
				</DialogHeader>
				{pageId && <Form key={pageId} id={pageId} />}
			</DialogContent>
		</Dialog>
	)
}
