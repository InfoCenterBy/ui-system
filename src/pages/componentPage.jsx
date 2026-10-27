import { useEffect, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import ComponentWrapper from '../components/system/componentWrapper'
import { getCategory } from '../registry'

const ComponentView = ({ category, variant }) => {
	const [active, setActive] = useState({
		category: category.slug,
		name: variant,
		tab: 'preview',
	})

	// Bring the variant from search into view
	useEffect(() => {
		if (!variant) return
		document
			.getElementById(`${category.slug}-${variant}`)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}, [category.slug, variant])

	return (
		<div className='mx-auto max-w-7xl'>
			<h1 className='text-3xl font-bold'>{category.name}</h1>
			<p className='mt-2 mb-6 text-base-content/70'>
				{category.description}
			</p>
			<ComponentWrapper
				category={category.slug}
				components={category.variants}
				selectedComponent={active}
				setSelectedComponent={setActive}
			/>
		</div>
	)
}

const ComponentPage = () => {
	const { slug } = useParams()
	const [searchParams] = useSearchParams()
	const category = getCategory(slug)
	const variant = searchParams.get('v') ?? undefined

	if (!category) return <Navigate to='/' replace />

	// Remount on navigation so the view state starts fresh
	return (
		<ComponentView
			key={`${slug}:${variant}`}
			category={category}
			variant={variant}
		/>
	)
}

export default ComponentPage
