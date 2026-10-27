const Collapse = () => {
	return (
		<div className='collapse-arrow collapse border border-base-300 bg-base-100'>
			<input type='checkbox' />
			<div className='collapse-title font-semibold'>
				How do I create an account?
			</div>
			<div className='collapse-content text-sm'>
				Click the "Sign Up" button in the top right corner and follow
				the registration process.
			</div>
		</div>
	)
}

export default Collapse
