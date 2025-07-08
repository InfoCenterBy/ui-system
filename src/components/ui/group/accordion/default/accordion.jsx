import classNames from 'classnames'

const AccordionDefault = () => {
	const accordionClass = classNames(
		'collapse collapse-arrow bg-base-100 border border-base-300 '
	)
	return (
		<div className='flex flex-col gap-2'>
			<div className={accordionClass}>
				<input type='radio' name='my-accordion-2' defaultChecked />
				<div className='collapse-title font-semibold'>
					How do I create an account?
				</div>
				<div className='collapse-content text-sm'>
					Click the "Sign Up" button in the top right corner and
					follow the registration process.
				</div>
			</div>
			<div className={accordionClass}>
				<input type='radio' name='my-accordion-2' />
				<div className='collapse-title font-semibold'>
					I forgot my password. What should I do?
				</div>
				<div className='collapse-content text-sm'>
					Click on "Forgot Password" on the login page and follow
					the instructions sent to your email.
				</div>
			</div>
			<div className={accordionClass}>
				<input type='radio' name='my-accordion-2' />
				<div className='collapse-title font-semibold'>
					How do I update my profile information?
				</div>
				<div className='collapse-content text-sm'>
					Go to "My Account" settings and select "Edit Profile"
					to make changes.
				</div>
			</div>
		</div>
	)
}

export default AccordionDefault
