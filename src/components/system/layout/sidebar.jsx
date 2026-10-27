import { Link, NavLink } from 'react-router-dom'
import classNames from 'classnames'
import Icon from '../icon'
import { categoryPath, groupedCategories, pages } from '../../../registry'

const PAGE_ICONS = {
	'/': 'grid',
	'/theme-generator': 'swatch',
	'/colors': 'brush',
}

const linkClass = ({ isActive }) => classNames({ 'menu-active': isActive })

const Sidebar = ({ onNavigate }) => {
	return (
		<aside className='flex min-h-full w-72 flex-col border-e border-base-200 bg-base-100'>
			<div className='sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-base-100 px-6'>
				<Link to='/' className='text-lg font-bold' onClick={onNavigate}>
					UI System
				</Link>
				<span className='badge badge-ghost badge-sm'>daisyUI 5</span>
			</div>
			<ul className='menu w-full px-4 pb-10'>
				{pages.map((page) => (
					<li key={page.path}>
						<NavLink
							to={page.path}
							end
							className={linkClass}
							onClick={onNavigate}
						>
							<Icon
								name={PAGE_ICONS[page.path]}
								className='size-4'
							/>
							{page.name}
						</NavLink>
					</li>
				))}
				{groupedCategories.map((group) => [
					<li key={group.id} className='mt-4 menu-title'>
						{group.name}
					</li>,
					...group.categories.map((category) => (
						<li key={category.slug}>
							<NavLink
								to={categoryPath(category.slug)}
								className={linkClass}
								onClick={onNavigate}
							>
								{category.name}
							</NavLink>
						</li>
					)),
				])}
			</ul>
		</aside>
	)
}

export default Sidebar
