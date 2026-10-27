import { Link } from 'react-router-dom'
import ThemeToggle from './themeToggle'
import classNames from 'classnames'

const NavBar = ({ className }) => {
	const linkStyle =
		'hover:opacity-70 underline-offset-2 transition duration-300 text-base-content'
	return (
		<>
			<div
				className={classNames(
					className,
					'mt-3.5 flex flex-row items-center justify-between rounded-lg border border-base-content bg-base-200 py-2'
				)}
			>
				<nav className='w-full'>
					<ul className='flex flex-row justify-center gap-x-2'>
						<li>
							<Link to='/' className={linkStyle}>
								home
							</Link>
						</li>
						<li>
							<Link to='/ui' className={linkStyle}>
								ui
							</Link>
						</li>
						<li>
							<Link to='/test' className={linkStyle}>
								test page
							</Link>
						</li>
					</ul>
				</nav>
				<ThemeToggle />
			</div>
		</>
	)
}

export default NavBar
