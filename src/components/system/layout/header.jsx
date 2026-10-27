import { Link } from 'react-router-dom'
import Icon from '../icon'
import Search from './search'
import ThemeToggle from '../themeToggle'

const Header = ({ drawerId }) => {
	return (
		<header className='sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-base-200 bg-base-100/90 px-4 backdrop-blur lg:px-10'>
			<label
				htmlFor={drawerId}
				className='btn btn-square btn-ghost lg:hidden'
				aria-label='Open menu'
			>
				<Icon name='menu' />
			</label>
			<Link to='/' className='text-lg font-bold lg:hidden'>
				UI System
			</Link>
			<div className='ms-auto flex items-center gap-2'>
				<Search />
				<ThemeToggle />
			</div>
		</header>
	)
}

export default Header
