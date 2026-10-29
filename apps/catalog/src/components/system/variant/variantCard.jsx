import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react'
import classNames from 'classnames'
import Icon from '../icon'
import SandboxFrame from './sandboxFrame'
import { useSiteTheme } from './useSiteTheme'
import { htmlToJsx } from '../../../lib/htmlToJsx'
import { copyText } from '../../../lib/toast'
import {
	CODE_FORMATS,
	PREVIEW_WIDTHS,
	codeFormat,
	favoriteId,
	toggleFavorite,
	useCodeFormat,
	useFavorites,
	usePreviewTheme,
	usePreviewWidth,
} from '../../../lib/preferences'

// CodeMirror loads on intent, hovering Code warms it up before the click
let LoadedEditor = null
const loadEditor = () =>
	import('./codeEditor').then((module) => {
		LoadedEditor = module.default
		return module
	})
const LazyEditor = lazy(loadEditor)

const VariantCard = ({ category, variant, highlighted }) => {
	const [code, setCode] = useState(variant.html)
	const [codeOpen, setCodeOpen] = useState(false)
	// Picked on first open and kept, so the editor never remounts mid-edit.
	// Stays mounted after that so closing can animate too
	const [Editor, setEditor] = useState(null)
	const format = useCodeFormat()
	const width = usePreviewWidth()
	const themeChoice = usePreviewTheme()
	const site = useSiteTheme()
	const id = favoriteId(category.slug, variant.name)
	const isFavorite = useFavorites().includes(id)
	const previewHtml = useDeferredValue(code)
	const edited = code !== variant.html
	const label = format.toUpperCase()

	const jsx = useMemo(
		() => (format === 'jsx' ? htmlToJsx(code) : ''),
		[format, code]
	)

	const copy = () => copyText(format === 'jsx' ? jsx : code.trim(), label)

	const copyLink = () => {
		const url = new URL(window.location.href)
		url.hash = `/components/${category.slug}?v=${variant.name}`
		copyText(url.href, 'Link')
	}

	const toggleCode = () => {
		// Preloaded editor renders without a Suspense fallback
		if (!Editor) setEditor(() => LoadedEditor ?? LazyEditor)
		setCodeOpen((open) => !open)
	}

	return (
		<section
			id={`example-${category.slug}-${variant.name}`}
			className='scroll-mt-24'
		>
			<div className='mb-2 flex flex-wrap items-center gap-2'>
				<h2 className='font-semibold'>{variant.title}</h2>
				{edited && (
					<span className='badge badge-soft badge-sm badge-warning'>
						edited
					</span>
				)}
				<div className='ms-auto flex items-center gap-1'>
					<button
						className='btn btn-square btn-ghost btn-sm'
						aria-label={
							isFavorite
								? 'Remove from favorites'
								: 'Add to favorites'
						}
						aria-pressed={isFavorite}
						onClick={() => toggleFavorite(id)}
					>
						<Icon
							name='star'
							filled={isFavorite}
							className={classNames('size-4', {
								'text-warning': isFavorite,
							})}
						/>
					</button>
					<button
						className='btn btn-square btn-ghost btn-sm'
						aria-label='Copy link to this example'
						onClick={copyLink}
					>
						<Icon name='link' className='size-4' />
					</button>
					<button
						className={classNames('btn btn-ghost btn-sm', {
							'btn-active': codeOpen,
						})}
						aria-expanded={codeOpen}
						onClick={toggleCode}
						onPointerEnter={loadEditor}
						onFocus={loadEditor}
					>
						<Icon name='code' className='size-4' />
						Code
					</button>
					<button className='btn btn-ghost btn-sm' onClick={copy}>
						<Icon name='copy' className='size-4' />
						Copy {label}
					</button>
				</div>
			</div>
			<div
				className={classNames(
					'overflow-x-auto rounded-box border border-base-300 bg-base-200',
					{ 'animate-variant-highlight': highlighted }
				)}
			>
				<SandboxFrame
					title={`${category.name} ${variant.title}`}
					html={previewHtml}
					live={edited}
					rootClass={category.previewClass}
					theme={themeChoice === 'site' ? site.theme : themeChoice}
					customCss={site.customCss}
					width={PREVIEW_WIDTHS[width]}
				/>
			</div>
			{/* Grid rows 0fr to 1fr animate the height to fit the content */}
			<div
				inert={!codeOpen}
				className={classNames(
					'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
					codeOpen
						? 'grid-rows-[1fr] opacity-100'
						: 'grid-rows-[0fr] opacity-0'
				)}
			>
				<div className='min-h-0 overflow-hidden'>
					{Editor && (
						<div
							className={classNames(
								'pt-2 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
								{ '-translate-y-2': !codeOpen }
							)}
						>
							<div className='mb-2 flex flex-wrap items-center gap-2'>
								<div
									role='tablist'
									className='tabs tabs-box tabs-sm'
								>
									{CODE_FORMATS.map((f) => (
										<button
											key={f}
											role='tab'
											aria-selected={format === f}
											className={classNames('tab', {
												'tab-active': format === f,
											})}
											onClick={() => codeFormat.set(f)}
										>
											{f.toUpperCase()}
										</button>
									))}
								</div>
								{format === 'jsx' && (
									<span className='text-xs text-base-content/60'>
										Generated from HTML, edit in the HTML
										tab
									</span>
								)}
								{edited && (
									<button
										className='btn ms-auto btn-ghost btn-xs'
										onClick={() => setCode(variant.html)}
									>
										<Icon
											name='reset'
											className='size-3.5'
										/>
										Reset
									</button>
								)}
							</div>
							<Suspense
								fallback={
									<div className='h-40 w-full skeleton' />
								}
							>
								{format === 'html' ? (
									<Editor
										key='html'
										value={code}
										onChange={setCode}
									/>
								) : (
									<Editor
										key='jsx'
										value={jsx}
										language='jsx'
										readOnly
									/>
								)}
							</Suspense>
						</div>
					)}
				</div>
			</div>
		</section>
	)
}

export default VariantCard
