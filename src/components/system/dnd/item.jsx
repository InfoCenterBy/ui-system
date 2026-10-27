import { forwardRef } from 'react'

export const Item = forwardRef(({ id, children, ...props }, ref) => {
	return (
		<div
			{...props}
			ref={ref}
			className='h-[100px] w-[100px] rounded-md bg-base-300 p-2 text-base-content'
		>
			{children || id}
		</div>
	)
})
