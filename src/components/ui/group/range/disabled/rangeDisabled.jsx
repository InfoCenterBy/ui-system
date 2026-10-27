const RangeDisabled = () => {
	return (
		<input
			type='range'
			min={0}
			max='100'
			defaultValue='80'
			className='range'
			disabled={true}
		/>
	)
}

export default RangeDisabled
