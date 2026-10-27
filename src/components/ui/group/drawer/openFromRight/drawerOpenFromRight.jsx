const DrawerOpenFromRight = () => {
	return (
		<div className='drawer drawer-end'>
			<input id='my-drawer-4' type='checkbox' className='drawer-toggle' />
			<div className='drawer-content'>
				<label
					htmlFor='my-drawer-4'
					className='btn rounded-full drawer-button'
				>
					Open drawer from right
				</label>
			</div>
			<div className='drawer-side z-20'>
				<label
					htmlFor='my-drawer-4'
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

export default DrawerOpenFromRight
