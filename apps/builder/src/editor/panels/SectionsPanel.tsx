import { toast } from 'sonner'
import { sectionCategories, sectionPresets } from '@ui-system/blocks/sections'
import { Button } from '@/components/ui/button'
import { addSection } from '@/store/actions'

export function SectionsPanel() {
	return (
		<div className='flex flex-col gap-4 p-3'>
			{sectionCategories.map((category) => (
				<section key={category.id} className='flex flex-col gap-1'>
					<h3 className='text-muted-foreground text-xs font-medium'>
						{category.name}
					</h3>
					{sectionPresets
						.filter((preset) => preset.category === category.id)
						.map((preset) => (
							<Button
								key={preset.id}
								variant='ghost'
								size='sm'
								className='justify-start'
								onClick={() => {
									try {
										addSection(preset.id)
									} catch (e) {
										toast.error((e as Error).message)
									}
								}}
							>
								{preset.name}
							</Button>
						))}
				</section>
			))}
		</div>
	)
}
