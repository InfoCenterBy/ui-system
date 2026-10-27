const PaginationSizes = () => {
	return (
		<>
			<div className='join flex flex-col gap-2'>
				<div className='join'>
					<button className='btn join-item btn-xs'>1</button>
					<button className='btn btn-active join-item btn-xs'>
						2
					</button>
					<button className='btn join-item btn-xs'>3</button>
					<button className='btn join-item btn-xs'>4</button>
				</div>
				<div className='join'>
					<button className='btn join-item btn-sm'>1</button>
					<button className='btn btn-active join-item btn-sm'>
						2
					</button>
					<button className='btn join-item btn-sm'>3</button>
					<button className='btn join-item btn-sm'>4</button>
				</div>
				<div className='join'>
					<button className='btn join-item btn-md'>1</button>
					<button className='btn btn-active join-item btn-md'>
						2
					</button>
					<button className='btn join-item btn-md'>3</button>
					<button className='btn join-item btn-md'>4</button>
				</div>
				<div className='join'>
					<button className='btn join-item btn-lg'>1</button>
					<button className='btn btn-active join-item btn-lg'>
						2
					</button>
					<button className='btn join-item btn-lg'>3</button>
					<button className='btn join-item btn-lg'>4</button>
				</div>
				<div className='join'>
					<button className='btn join-item btn-xl'>1</button>
					<button className='btn btn-active join-item btn-xl'>
						2
					</button>
					<button className='btn join-item btn-xl'>3</button>
					<button className='btn join-item btn-xl'>4</button>
				</div>
			</div>
		</>
	)
}

export default PaginationSizes
