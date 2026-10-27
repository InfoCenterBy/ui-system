import { Link } from 'react-router-dom'
import HtmlPreview from '../components/system/variant/htmlPreview'
import { categories, categoryPath, groupedCategories } from '../registry'

const Overview = () => {
	return (
		<div className='mx-auto max-w-7xl'>
			<h1 className='text-3xl font-bold'>Components</h1>
			<p className='mt-2 text-base-content/70'>
				{categories.length} daisyUI components ready to copy as HTML or
				JSX
			</p>
			{groupedCategories.map((group) => (
				<section key={group.id} className='mt-10'>
					<h2 className='mb-4 text-lg font-semibold'>{group.name}</h2>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{group.categories.map((category) => (
							<Link
								key={category.slug}
								to={categoryPath(category.slug)}
								className='group card min-w-0 border border-base-300 bg-base-100 transition-colors hover:border-base-content/30'
							>
								<div
									inert
									className='relative h-44 overflow-hidden rounded-t-box bg-base-200'
								>
									<HtmlPreview
										html={category.showcase.html}
										className='pointer-events-none absolute inset-0 flex scale-75 flex-wrap items-center justify-center gap-3 p-4 select-none'
									/>
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
