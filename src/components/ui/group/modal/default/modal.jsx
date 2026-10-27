const Modal = () => {
	return (
		<>
			{/* Open with document.getElementById('ID').showModal() */}
			<button
				className='btn'
				onClick={() =>
					document.getElementById('my_modal_3').showModal()
				}
			>
				open modal
			</button>
			<dialog id='my_modal_3' className='modal'>
				<div className='modal-box'>
					{/* A button inside the form closes the modal */}
					<form method='dialog'>
						<button className='btn absolute top-2 right-2 btn-circle btn-ghost btn-sm'>
							✕
						</button>
					</form>
					<h3 className='text-lg font-bold'>Hello!</h3>
					<p className='py-4'>
						Press ESC key or click on ✕ button to close
					</p>
				</div>
				<form method='dialog' className='modal-backdrop'>
					<button>close</button>
				</form>
			</dialog>
		</>
	)
}

export default Modal
