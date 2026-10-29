import ColorParent from '../components/system/colors/colorParent'

const Colors = () => {
	return (
		<div className='mx-auto max-w-7xl'>
			<h1 className='text-3xl font-bold'>Colors</h1>
			<p className='mt-2 mb-6 text-base-content/70'>
				Tailwind palette, click a swatch to copy it
			</p>
			<ColorParent />
		</div>
	)
}

export default Colors
