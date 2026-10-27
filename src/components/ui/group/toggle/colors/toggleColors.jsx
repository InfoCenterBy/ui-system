const ToggleColors = () => {
	return (
		<>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-primary'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-secondary'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-accent'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-neutral'
			/>

			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-info'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-success'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-warning'
			/>
			<input
				type='checkbox'
				defaultChecked
				className='toggle toggle-error'
			/>
		</>
	)
}

export default ToggleColors
