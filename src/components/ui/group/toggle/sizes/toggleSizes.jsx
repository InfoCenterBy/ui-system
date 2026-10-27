const ToggleSizes = () => {
	return (
		<>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-xs'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-sm'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-md'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-lg'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-xl'
			/>
		</>
	)
}

export default ToggleSizes
