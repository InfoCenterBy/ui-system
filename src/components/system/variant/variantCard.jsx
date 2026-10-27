import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react'
import classNames from 'classnames'
import Icon from '../icon'
import HtmlPreview from './htmlPreview'
import { PREVIEW_BOX } from './previewBox'
import { htmlToJsx } from '../../../lib/htmlToJsx'
import { copyText } from '../../../lib/toast'
import { setCodeFormat, useCodeFormat } from '../../../lib/codeFormat'

// CodeMirror loads only when a code block is opened
const CodeEditor = lazy(() => import('./codeEditor'))

const FORMATS = ['html', 'jsx']

const VariantCard = ({ category, variant, highlighted }) => {
	const [code, setCode] = useState(variant.html)
	const [codeOpen, setCodeOpen] = useState(false)
	const format = useCodeFormat()
	const previewHtml = useDeferredValue(code)
	const edited = code !== variant.html
	const label = format.toUpperCase()

	const jsx = useMemo(
		() => (format === 'jsx' ? htmlToJsx(code) : ''),
		[format, code]
	)

	const copy = () => copyText(format === 'jsx' ? jsx : code.trim(), label)

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
						className={classNames('btn btn-ghost btn-sm', {
							'btn-active': codeOpen,
						})}
						aria-expanded={codeOpen}
						onClick={() => setCodeOpen((open) => !open)}
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
			<HtmlPreview
				html={previewHtml}
				className={classNames(PREVIEW_BOX, category.previewClass, {
					'animate-variant-highlight': highlighted,
				})}
			/>
			{codeOpen && (
				<div className='mt-2'>
					<div className='mb-2 flex flex-wrap items-center gap-2'>
						<div role='tablist' className='tabs tabs-box tabs-sm'>
							{FORMATS.map((f) => (
								<button
									key={f}
									role='tab'
									aria-selected={format === f}
									className={classNames('tab', {
										'tab-active': format === f,
									})}
									onClick={() => setCodeFormat(f)}
								>
									{f.toUpperCase()}
								</button>
							))}
						</div>
						{format === 'jsx' && (
							<span className='text-xs text-base-content/60'>
								Generated from HTML, edit in the HTML tab
							</span>
						)}
						{edited && (
							<button
								className='btn ms-auto btn-ghost btn-xs'
								onClick={() => setCode(variant.html)}
							>
								<Icon name='reset' className='size-3.5' />
								Reset
							</button>
						)}
					</div>
					<Suspense
						fallback={<div className='h-40 w-full skeleton' />}
					>
						{format === 'html' ? (
							<CodeEditor
								key='html'
								value={code}
								onChange={setCode}
							/>
						) : (
							<CodeEditor
								key='jsx'
								value={jsx}
								language='jsx'
								readOnly
							/>
						)}
					</Suspense>
				</div>
			)}
		</section>
	)
}

export default VariantCard
