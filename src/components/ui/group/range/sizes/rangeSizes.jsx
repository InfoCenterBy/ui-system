const RangeSizes = () => {
	return (
		<div className='flex flex-col gap-2'>
			<input
				type='range'
				min={0}
				max='100'
				defaultValue='30'
				className='range range-xs'
			/>
			<input
				type='range'
				min={0}
				max='100'
				defaultValue='40'
				className='range range-sm'
			/>
			<input
				type='range'
				min={0}
				max='100'
				defaultValue='50'
				className='range range-md'
			/>
			<input
				type='range'
				min={0}
				max='100'
				defaultValue='60'
				className='range range-lg'
			/>
			<input
				type='range'
				min={0}
				max='100'
				defaultValue='70'
				className='range range-xl'
			/>
		</div>
	)
}

export default RangeSizes
