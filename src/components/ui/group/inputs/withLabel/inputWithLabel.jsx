const InputWithLabel = () => {
	return (
		<>
			<label className='input'>
				Path
				<input type='text' className='grow' placeholder='src/app/' />
				<span className='badge badge-xs badge-neutral'>Optional</span>
			</label>
		</>
	)
}

export default InputWithLabel
