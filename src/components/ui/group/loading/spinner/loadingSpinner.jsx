const LoadingSpinner = () => {
	return (
		<div className='flex flex-col gap-2'>
			<span className='loading loading-xs loading-spinner'></span>
			<span className='loading loading-sm loading-spinner'></span>
			<span className='loading loading-md loading-spinner'></span>
			<span className='loading loading-lg loading-spinner'></span>
			<span className='loading loading-xl loading-spinner'></span>
		</div>
	)
}

export default LoadingSpinner
