import { useEffect, useRef } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import VariantCard from '../components/system/variant/variantCard'
import PreviewToolbar from '../components/system/variant/previewToolbar'
import { getCategory } from '../registry'

const SETTLE_TIME = 3000
const STOP_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown']

// Keeps the target in view while iframes above it grow, until the user scrolls
const useScrollToTarget = (containerRef, targetId) => {
	useEffect(() => {
		if (!targetId) return
		const scroll = (behavior) =>
			document
				.getElementById(targetId)
				?.scrollIntoView({ behavior, block: 'start' })
		scroll('smooth')
		const observer = new ResizeObserver(() => scroll('auto'))
		observer.observe(containerRef.current)
		const stop = () => {
			observer.disconnect()
			STOP_EVENTS.forEach((type) =>
				window.removeEventListener(type, stop)
			)
		}
		STOP_EVENTS.forEach((type) =>
			window.addEventListener(type, stop, { passive: true })
		)
		const timer = setTimeout(stop, SETTLE_TIME)
		return () => {
			clearTimeout(timer)
			stop()
		}
	}, [containerRef, targetId])
}

const ComponentView = ({ category, target }) => {
	const containerRef = useRef(null)
	useScrollToTarget(
		containerRef,
		target ? `example-${category.slug}-${target}` : null
	)

	return (
		<div className='mx-auto max-w-6xl' ref={containerRef}>
			<div className='flex flex-wrap items-end gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>{category.name}</h1>
					<p className='mt-2 text-base-content/70'>
						{category.description}
					</p>
				</div>
				<PreviewToolbar className='ms-auto' />
			</div>
			{category.note && (
				<div role='note' className='mt-4 alert alert-soft text-sm'>
					{category.note}
				</div>
			)}
			<div className='mt-8 flex flex-col gap-10'>
				{category.variants.map((variant) => (
					<VariantCard
						key={variant.name}
						category={category}
						variant={variant}
						highlighted={variant.name === target}
					/>
				))}
			</div>
		</div>
	)
}

const ComponentPage = () => {
	const { slug } = useParams()
	const [searchParams] = useSearchParams()
	const category = getCategory(slug)
	const target = searchParams.get('v') ?? undefined

	if (!category) return <Navigate to='/' replace />

	// Remount on navigation so edits and highlight start fresh
	return (
		<ComponentView
			key={`${slug}:${target}`}
			category={category}
			target={target}
		/>
	)
}

export default ComponentPage
