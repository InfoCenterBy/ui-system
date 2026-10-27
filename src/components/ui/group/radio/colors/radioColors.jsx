const RadioColors = () => {
	return (
		<div className='flex flex-wrap gap-2'>
			<input
				type='radio'
				name='radio-12'
				defaultChecked
				className='radio border-red-300 bg-red-100 checked:border-red-600 checked:bg-red-200 checked:text-red-600'
			/>
			<input
				type='radio'
				name='radio-12'
				defaultChecked
				className='radio border-blue-300 bg-blue-100 checked:border-blue-600 checked:bg-blue-200 checked:text-blue-600'
			/>
		</div>
	)
}

export default RadioColors
