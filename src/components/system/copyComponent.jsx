import CopyHtml from '../hooks/copyHtml'
import SystemToast from './systemToast'
import { toast } from 'react-toastify'

const CopyComponent = ({ children, objToCopy, copyName, id, name }) => {
	const capitalizeName =
		typeof id === 'string' && id.length > 0
			? id.replace(/-/g, ' ').replace(/^./, (char) => char.toUpperCase())
			: 'Html'
	const toastConfig = {
		position: 'top-right',
		autoClose: 1000,
		closeOnClick: true,
		closeButton: false,
		hideProgressBar: true,
	}
	const notify = () => {
		try {
			toast(
				<SystemToast type='success'>
					{capitalizeName} copied!
				</SystemToast>,
				toastConfig
			)
			CopyHtml(objToCopy)
		} catch (error) {
			console.log(Error, error)
			toast(
				<SystemToast type='error'>
					{capitalizeName} not copied!
				</SystemToast>,
				toastConfig
			)
		}
	}
	return (
		<div className='' id={id}>
			<div className='flex items-center justify-between gap-2'>
				<div className='pointer-none block text-sm text-base-content italic opacity-60 select-none'>
					{name}
				</div>
				<div
					className='tooltip tooltip-left tooltip-accent'
					onClick={notify}
				>
					<div className='tooltip-content ms-3'>
						<div className='text-[.75rem]'>copy {copyName}</div>
					</div>
					<div className='cursor-pointer'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							fill='none'
							viewBox='0 0 24 24'
							strokeWidth={1.5}
							stroke='currentColor'
							className='h-5 w-5 stroke-base-content'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z'
							/>
						</svg>
					</div>
				</div>
			</div>
			<div className='mt-2'>{children}</div>
		</div>
	)
}

export default CopyComponent
