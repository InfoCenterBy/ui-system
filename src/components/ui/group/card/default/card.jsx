const Card = () => {
	return (
		<>
			<div className='card w-96 bg-base-100 shadow-sm'>
				<figure>
					{/* <img
						src='https://infocenterby.github.io/newInfoCenter/img/png/main/activity-img-cashier.png'
						alt='Cashier'
					/> */}
					<div className='p-3'>
						<div className='h-[18.75rem] max-h-[300px] w-full skeleton border border-base-content'></div>
					</div>
				</figure>
				<div className='card-body'>
					<h2 className='card-title'>Card Title</h2>
					<p>
						A card component has a figure, a body part, and inside
						body there are title and actions parts
					</p>
					<div className='card-actions justify-start'>
						<button className='btn btn-primary'>Buy Now</button>
					</div>
				</div>
			</div>
		</>
	)
}

export default Card
