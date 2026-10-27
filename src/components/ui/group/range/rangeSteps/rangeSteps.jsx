const RangeSteps = () => {
	return (
		<div className='w-full max-w-xs'>
			<input
				type='range'
				min={0}
				max='100'
				defaultValue='25'
				className='range'
				step='25'
			/>
			<div className='mt-2 flex justify-between px-2.5 text-xs'>
				<span>|</span>
				<span>|</span>
				<span>|</span>
				<span>|</span>
				<span>|</span>
			</div>
			<div className='mt-2 flex justify-between px-2.5 text-xs'>
				<span>1</span>
				<span>2</span>
				<span>3</span>
				<span>4</span>
				<span>5</span>
			</div>
		</div>
	)
}

export default RangeSteps
