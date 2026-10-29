import { Link } from 'react-router-dom'
import VariantCard from '../components/system/variant/variantCard'
import PreviewToolbar from '../components/system/variant/previewToolbar'
import Icon from '../components/system/icon'
import { categories, categoryPath } from '../registry'
import { favoriteId, useFavorites } from '../lib/preferences'

const Favorites = () => {
	const ids = useFavorites()
	// Library order, so favorites of one component stay together
	const sections = categories
		.map((category) => ({
			category,
			variants: category.variants.filter((v) =>
				ids.includes(favoriteId(category.slug, v.name))
			),
		}))
		.filter((section) => section.variants.length > 0)

	return (
		<div className='mx-auto max-w-6xl'>
			<div className='flex flex-wrap items-end gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>Favorites</h1>
					<p className='mt-2 text-base-content/70'>
						Examples you starred, saved in this browser
					</p>
				</div>
				{sections.length > 0 && <PreviewToolbar className='ms-auto' />}
			</div>
			{sections.length === 0 && (
				<div className='mt-10 flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 p-10 text-center'>
					<Icon name='star' className='size-8 text-base-content/40' />
					<p className='text-base-content/70'>
						Star an example with the{' '}
						<Icon name='star' className='inline size-4' /> button to
						keep it here.
					</p>
					<Link to='/' className='btn btn-sm'>
						Browse components
					</Link>
				</div>
			)}
			{sections.map(({ category, variants }) => (
				<section key={category.slug} className='mt-10'>
					<h2 className='mb-4 text-xl font-bold'>
						<Link
							to={categoryPath(category.slug)}
							className='link-hover'
						>
							{category.name}
						</Link>
					</h2>
					<div className='flex flex-col gap-10'>
						{variants.map((variant) => (
							<VariantCard
								key={variant.name}
								category={category}
								variant={variant}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	)
}

export default Favorites
