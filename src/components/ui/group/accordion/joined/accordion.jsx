import classNames from 'classnames'

const AccordionJoined = () => {
	const accordionClass = classNames(
		'collapse collapse-arrow border-2 border-base-200 bg-base-100 join-item shadow-md hover:shadow-lg transition-shadow duration-200'
	)
	return (
		<div className='join join-vertical'>
			<div className={classNames(accordionClass, 'rounded-t-lg')}>
				<input type='radio' name='my-accordion-4' defaultChecked />
				<div className='collapse-title text-base font-semibold text-base-content'>
					How do I create an account?
				</div>
				<div className='collapse-content text-sm leading-relaxed text-base-content'>
					Click the "Sign Up" button in the top right corner and
					follow the registration process.
				</div>
			</div>
			<div className={accordionClass}>
				<input type='radio' name='my-accordion-4' />
				<div className='collapse-title text-base font-semibold text-base-content'>
					I forgot my password. What should I do?
				</div>
				<div className='collapse-content text-sm leading-relaxed text-base-content'>
					Click on "Forgot Password" on the login page and follow the
					instructions sent to your email.
				</div>
			</div>
			<div className={classNames(accordionClass, 'rounded-b-lg')}>
				<input type='radio' name='my-accordion-4' />
				<div className='collapse-title text-base font-semibold text-base-content'>
					How do I update my profile information?
				</div>
				<div className='collapse-content text-sm leading-relaxed text-base-content'>
					Go to "My Account" settings and select "Edit Profile" to
					make changes.
				</div>
			</div>
		</div>
	)
}

export default AccordionJoined
