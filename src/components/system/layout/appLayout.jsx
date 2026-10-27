import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'
import Toaster from '../toaster'

const DRAWER_ID = 'app-drawer'

const AppLayout = () => {
	const [drawerOpen, setDrawerOpen] = useState(false)
	const { pathname, search } = useLocation()

	// Start each page from the top unless a variant is targeted
	useEffect(() => {
		if (!new URLSearchParams(search).has('v')) window.scrollTo(0, 0)
	}, [pathname, search])

	return (
		<div className='drawer lg:drawer-open'>
			<input
				id={DRAWER_ID}
				type='checkbox'
				className='drawer-toggle'
				checked={drawerOpen}
				onChange={(e) => setDrawerOpen(e.target.checked)}
			/>
			<div className='drawer-content flex min-h-screen min-w-0 flex-col'>
				<Header drawerId={DRAWER_ID} />
				<main className='flex-1 px-4 pt-6 pb-20 lg:px-10'>
					<Outlet />
				</main>
			</div>
			<div className='drawer-side z-40'>
				<label
					htmlFor={DRAWER_ID}
					aria-label='Close menu'
					className='drawer-overlay'
				/>
				<Sidebar onNavigate={() => setDrawerOpen(false)} />
			</div>
			<Toaster />
		</div>
	)
}

export default AppLayout
