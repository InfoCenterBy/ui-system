const FloatingLabel = () => {
	return (
		<label className='floating-label'>
			<span>Your Email</span>
			<input
				type='text'
				placeholder='mail@site.com'
				className='input input-md'
			/>
		</label>
	)
}

export default FloatingLabel
