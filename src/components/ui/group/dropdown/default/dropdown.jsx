const Dropdown = () => {
	return (
		<>
			{/* Use unique popover and anchor names for each dropdown */}
			{/* For TSX uncomment the type casts below */}
			<button
				className='btn'
				popoverTarget='popover-1'
				style={
					{
						anchorName: '--anchor-1',
					} /* as React.CSSProperties */
				}
			>
				Button
			</button>

			<ul
				className='menu dropdown w-52 rounded-box bg-base-100 shadow-sm'
				popover='auto'
				id='popover-1'
				style={
					{
						positionAnchor: '--anchor-1',
					} /* as React.CSSProperties */
				}
			>
				<li>
					<a>Item 1</a>
				</li>
				<li>
					<a>Item 2</a>
				</li>
			</ul>
		</>
	)
}

export default Dropdown
