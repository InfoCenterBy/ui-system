'use client'

import * as React from 'react'
import { cn } from 'cn'
import { Popover as PopoverPrimitive } from 'radix-ui'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

function PopoverContent({
	className,
	align = 'start',
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				data-slot='popover-content'
				align={align}
				sideOffset={sideOffset}
				className={cn(
					'bg-popover text-popover-foreground border-border z-50 rounded-lg border shadow-md outline-none',
					className
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	)
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger }
