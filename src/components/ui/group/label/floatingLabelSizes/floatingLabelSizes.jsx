const FloatingLabelSizes = () => {
	return (
		<div className='flex flex-col gap-2'>
			<label className='floating-label'>
				<input
					type='text'
					placeholder='Extra Small'
					className='input input-xs'
				/>
				<span>Extra Small</span>
			</label>
			<label className='floating-label'>
				<input
					type='text'
					placeholder='Small'
					className='input input-sm'
				/>
				<span>Small</span>
			</label>
			<label className='floating-label'>
				<input
					type='text'
					placeholder='Medium'
					className='input input-md'
				/>
				<span>Medium</span>
			</label>
			<label className='floating-label'>
				<input
					type='text'
					placeholder='Large'
					className='input input-lg'
				/>
				<span>Large</span>
			</label>
			<label className='floating-label'>
				<input
					type='text'
					placeholder='Extra Large'
					className='input input-xl'
				/>
				<span>Extra Large</span>
			</label>
		</div>
	)
}

export default FloatingLabelSizes
