import { useEffect } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import VariantCard from '../components/system/variant/variantCard'
import { getCategory } from '../registry'

const ComponentView = ({ category, target }) => {
	// Bring the variant picked in search into view
	useEffect(() => {
		if (!target) return
		document
			.getElementById(`example-${category.slug}-${target}`)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}, [category.slug, target])

	return (
		<div className='mx-auto max-w-6xl'>
			<h1 className='text-3xl font-bold'>{category.name}</h1>
			<p className='mt-2 text-base-content/70'>{category.description}</p>
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
