const SelectSizes = () => {
	return (
		<div className='flex flex-col gap-2'>
			<select defaultValue='Xsmall' className='select select-xs'>
				<option disabled={true}>Xsmall</option>
				<option>Xsmall Apple</option>
				<option>Xsmall Orange</option>
				<option>Xsmall Tomato</option>
			</select>
			<select defaultValue='Small' className='select select-sm'>
				<option disabled={true}>Small</option>
				<option>Small Apple</option>
				<option>Small Orange</option>
				<option>Small Tomato</option>
			</select>
			<select defaultValue='Medium' className='select select-md'>
				<option disabled={true}>Medium</option>
				<option>Medium Apple</option>
				<option>Medium Orange</option>
				<option>Medium Tomato</option>
			</select>
			<select defaultValue='Large' className='select select-lg'>
				<option disabled={true}>Large</option>
				<option>Large Apple</option>
				<option>Large Orange</option>
				<option>Large Tomato</option>
			</select>
			<select defaultValue='Xlarge' className='select select-xl'>
				<option disabled={true}>Xlarge</option>
				<option>Xlarge Apple</option>
				<option>Xlarge Orange</option>
				<option>Xlarge Tomato</option>
			</select>
		</div>
	)
}

export default SelectSizes
