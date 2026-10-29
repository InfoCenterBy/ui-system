import type { ComponentProps, ReactNode } from 'react'
import { cn } from 'cn'

export function Field({
	label,
	children,
}: {
	label: string
	children: ReactNode
}) {
	return (
		<label className='flex flex-col gap-1 text-sm'>
			<span className='text-muted-foreground text-xs'>{label}</span>
			{children}
		</label>
	)
}

// Native select styled like Input, shadcn Select is not installed
export function NativeSelect({
	className,
	...props
}: ComponentProps<'select'>) {
	return (
		<select
			className={cn(
				'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-3',
				className
			)}
			{...props}
		/>
	)
}
