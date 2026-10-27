const InputSizes = () => {
	return (
		<div className='flex flex-col flex-wrap gap-2'>
			<input
				type='text'
				placeholder='Xsmall'
				className='input input-xs'
			/>
			<input type='text' placeholder='Small' className='input input-sm' />
			<input
				type='text'
				placeholder='Medium'
				className='input input-md'
			/>
			<input type='text' placeholder='Large' className='input input-lg' />
			<input
				type='text'
				placeholder='Xlarge'
				className='input input-xl'
			/>
		</div>
	)
}

export default InputSizes
