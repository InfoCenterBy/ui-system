import { Link } from 'react-router-dom'
import { categories, categoryPath, groupedCategories } from '../registry'

const Overview = () => {
	return (
		<div className='mx-auto max-w-7xl'>
			<h1 className='text-3xl font-bold'>Components</h1>
			<p className='mt-2 text-base-content/70'>
				{categories.length} components ready to copy
			</p>
			{groupedCategories.map((group) => (
				<section key={group.id} className='mt-10'>
					<h2 className='mb-4 text-lg font-semibold'>{group.name}</h2>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{group.categories.map((category) => (
							<Link
								key={category.slug}
								to={categoryPath(category.slug)}
								className='group card min-w-0 border border-base-200 bg-base-100 transition-colors hover:border-base-content/30'
							>
								<div
									inert
									className='flex h-44 items-center justify-center overflow-hidden rounded-t-box bg-base-200 p-4'
								>
									<div className='pointer-events-none scale-75 select-none'>
										{category.variants[0].component}
									</div>
								</div>
								<div className='card-body gap-1 p-4'>
									<h3 className='card-title text-base'>
										{category.name}
									</h3>
									<p className='text-sm text-base-content/70'>
										{category.description}
									</p>
								</div>
							</Link>
						))}
					</div>
				</section>
			))}
		</div>
	)
}

export default Overview
