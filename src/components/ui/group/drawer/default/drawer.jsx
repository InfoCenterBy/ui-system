const Drawer = () => {
	return (
		<div className='drawer'>
			<input id='my-drawer' type='checkbox' className='drawer-toggle' />
			<div className='drawer-content'>
				<label
					htmlFor='my-drawer'
					className='btn drawer-button btn-primary'
				>
					Open drawer
				</label>
			</div>
			<div className='drawer-side z-20'>
				<label
					htmlFor='my-drawer'
					aria-label='close sidebar'
					className='drawer-overlay'
				></label>
				<ul className='menu min-h-full w-80 bg-base-200 p-4 text-base-content'>
					<li>
						<a>Sidebar Item 1</a>
					</li>
					<li>
						<a>Sidebar Item 2</a>
					</li>
				</ul>
			</div>
		</div>
	)
}

export default Drawer
