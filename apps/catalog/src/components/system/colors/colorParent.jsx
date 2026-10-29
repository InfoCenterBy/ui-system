import { useState } from 'react'
import ColorBlock from './colorBlock'

const ColorParent = () => {
	const [colorStrength, setColorStrength] = useState(500)
	const COLOR_STRENGTHS = [
		50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
	]

	const COLOR_NAMES = [
		'slate',
		'gray',
		'zinc',
		'neutral',
		'stone',
		'red',
		'orange',
		'amber',
		'yellow',
		'lime',
		'green',
		'emerald',
		'teal',
		'cyan',
		'sky',
		'blue',
		'indigo',
		'violet',
		'purple',
		'fuchsia',
		'pink',
		'rose',
		'base',
	]

	const applyStrength = (colorClassName) => {
		colorClassName = colorClassName + `-${colorStrength}`
		return colorClassName
	}

	const [colorType, setColorType] = useState('name')

	return (
		<div>
			<h1 className='text-base-content'>Color Palette</h1>
			<div className='mt-3 flex flex-row items-center gap-3'>
				<div className='flex flex-col items-start gap-2'>
					<label
						htmlFor='strength'
						className='block text-base-content'
					>
						Color strength: {colorStrength}
					</label>
					<div className='w-full max-w-xs'>
						<input
							type='range'
							name='strength'
							id='strength'
							min={0}
							max={COLOR_STRENGTHS.length - 1}
							value={COLOR_STRENGTHS.indexOf(colorStrength)}
							onChange={(e) =>
								setColorStrength(
									COLOR_STRENGTHS[+e.target.value]
								)
							}
							className='range range-xs'
						/>
						<div className='mt-2 flex justify-between gap-2 px-2 text-xs'>
							{COLOR_STRENGTHS.map((element) => {
								return (
									<span
										className='base-content'
										key={element}
									>
										{element}
									</span>
								)
							})}
						</div>
					</div>
				</div>
				<div className='flex flex-row items-center gap-2'>
					<label htmlFor='type' className='block text-base-content'>
						Color name
					</label>
					<input
						type='checkbox'
						defaultChecked
						className='checkbox checked:shadow-none'
						name='type'
						id='type'
						onChange={(e) =>
							setColorType(e.target.checked ? 'name' : 'color')
						}
					/>
				</div>
			</div>
			<div className='mt-3 flex flex-wrap gap-2 rounded-lg border border-base-content p-2'>
				<ColorBlock
					colorFromParent='bg-black'
					colorType={colorType}
					textColor='text-white'
				/>
				<ColorBlock
					colorFromParent='bg-white'
					colorType={colorType}
					textColor='text-black'
				/>
				{/* Apply the selected strength to every -500 class below */}
				{COLOR_NAMES.map((color, key) => {
					return (
						<ColorBlock
							colorFromParent={applyStrength(`bg-${color}`)}
							colorType={colorType}
							key={key}
						/>
					)
				})}
			</div>
			<div className='hidden'>
				<div className='bg-red-50'></div>
				<div className='bg-red-100'></div>
				<div className='bg-red-200'></div>
				<div className='bg-red-300'></div>
				<div className='bg-red-400'></div>
				<div className='bg-red-500'></div>
				<div className='bg-red-600'></div>
				<div className='bg-red-700'></div>
				<div className='bg-red-800'></div>
				<div className='bg-red-900'></div>
				<div className='bg-red-950'></div>

				<div className='bg-orange-50'></div>
				<div className='bg-orange-100'></div>
				<div className='bg-orange-200'></div>
				<div className='bg-orange-300'></div>
				<div className='bg-orange-400'></div>
				<div className='bg-orange-500'></div>
				<div className='bg-orange-600'></div>
				<div className='bg-orange-700'></div>
				<div className='bg-orange-800'></div>
				<div className='bg-orange-900'></div>
				<div className='bg-orange-950'></div>

				<div className='bg-amber-50'></div>
				<div className='bg-amber-100'></div>
				<div className='bg-amber-200'></div>
				<div className='bg-amber-300'></div>
				<div className='bg-amber-400'></div>
				<div className='bg-amber-500'></div>
				<div className='bg-amber-600'></div>
				<div className='bg-amber-700'></div>
				<div className='bg-amber-800'></div>
				<div className='bg-amber-900'></div>
				<div className='bg-amber-950'></div>

				<div className='bg-yellow-50'></div>
				<div className='bg-yellow-100'></div>
				<div className='bg-yellow-200'></div>
				<div className='bg-yellow-300'></div>
				<div className='bg-yellow-400'></div>
				<div className='bg-yellow-500'></div>
				<div className='bg-yellow-600'></div>
				<div className='bg-yellow-700'></div>
				<div className='bg-yellow-800'></div>
				<div className='bg-yellow-900'></div>
				<div className='bg-yellow-950'></div>

				<div className='bg-lime-50'></div>
				<div className='bg-lime-100'></div>
				<div className='bg-lime-200'></div>
				<div className='bg-lime-300'></div>
				<div className='bg-lime-400'></div>
				<div className='bg-lime-500'></div>
				<div className='bg-lime-600'></div>
				<div className='bg-lime-700'></div>
				<div className='bg-lime-800'></div>
				<div className='bg-lime-900'></div>
				<div className='bg-lime-950'></div>

				<div className='bg-green-50'></div>
				<div className='bg-green-100'></div>
				<div className='bg-green-200'></div>
				<div className='bg-green-300'></div>
				<div className='bg-green-400'></div>
				<div className='bg-green-500'></div>
				<div className='bg-green-600'></div>
				<div className='bg-green-700'></div>
				<div className='bg-green-800'></div>
				<div className='bg-green-900'></div>
				<div className='bg-green-950'></div>

				<div className='bg-emerald-50'></div>
				<div className='bg-emerald-100'></div>
				<div className='bg-emerald-200'></div>
				<div className='bg-emerald-300'></div>
				<div className='bg-emerald-400'></div>
				<div className='bg-emerald-500'></div>
				<div className='bg-emerald-600'></div>
				<div className='bg-emerald-700'></div>
				<div className='bg-emerald-800'></div>
				<div className='bg-emerald-900'></div>
				<div className='bg-emerald-950'></div>

				<div className='bg-teal-50'></div>
				<div className='bg-teal-100'></div>
				<div className='bg-teal-200'></div>
				<div className='bg-teal-300'></div>
				<div className='bg-teal-400'></div>
				<div className='bg-teal-500'></div>
				<div className='bg-teal-600'></div>
				<div className='bg-teal-700'></div>
				<div className='bg-teal-800'></div>
				<div className='bg-teal-900'></div>
				<div className='bg-teal-950'></div>

				<div className='bg-cyan-50'></div>
				<div className='bg-cyan-100'></div>
				<div className='bg-cyan-200'></div>
				<div className='bg-cyan-300'></div>
				<div className='bg-cyan-400'></div>
				<div className='bg-cyan-500'></div>
				<div className='bg-cyan-600'></div>
				<div className='bg-cyan-700'></div>
				<div className='bg-cyan-800'></div>
				<div className='bg-cyan-900'></div>
				<div className='bg-cyan-950'></div>

				<div className='bg-sky-50'></div>
				<div className='bg-sky-100'></div>
				<div className='bg-sky-200'></div>
				<div className='bg-sky-300'></div>
				<div className='bg-sky-400'></div>
				<div className='bg-sky-500'></div>
				<div className='bg-sky-600'></div>
				<div className='bg-sky-700'></div>
				<div className='bg-sky-800'></div>
				<div className='bg-sky-900'></div>
				<div className='bg-sky-950'></div>

				<div className='bg-blue-50'></div>
				<div className='bg-blue-100'></div>
				<div className='bg-blue-200'></div>
				<div className='bg-blue-300'></div>
				<div className='bg-blue-400'></div>
				<div className='bg-blue-500'></div>
				<div className='bg-blue-600'></div>
				<div className='bg-blue-700'></div>
				<div className='bg-blue-800'></div>
				<div className='bg-blue-900'></div>
				<div className='bg-blue-950'></div>

				<div className='bg-indigo-50'></div>
				<div className='bg-indigo-100'></div>
				<div className='bg-indigo-200'></div>
				<div className='bg-indigo-300'></div>
				<div className='bg-indigo-400'></div>
				<div className='bg-indigo-500'></div>
				<div className='bg-indigo-600'></div>
				<div className='bg-indigo-700'></div>
				<div className='bg-indigo-800'></div>
				<div className='bg-indigo-900'></div>
				<div className='bg-indigo-950'></div>

				<div className='bg-violet-50'></div>
				<div className='bg-violet-100'></div>
				<div className='bg-violet-200'></div>
				<div className='bg-violet-300'></div>
				<div className='bg-violet-400'></div>
				<div className='bg-violet-500'></div>
				<div className='bg-violet-600'></div>
				<div className='bg-violet-700'></div>
				<div className='bg-violet-800'></div>
				<div className='bg-violet-900'></div>
				<div className='bg-violet-950'></div>

				<div className='bg-purple-50'></div>
				<div className='bg-purple-100'></div>
				<div className='bg-purple-200'></div>
				<div className='bg-purple-300'></div>
				<div className='bg-purple-400'></div>
				<div className='bg-purple-500'></div>
				<div className='bg-purple-600'></div>
				<div className='bg-purple-700'></div>
				<div className='bg-purple-800'></div>
				<div className='bg-purple-900'></div>
				<div className='bg-purple-950'></div>

				<div className='bg-fuchsia-50'></div>
				<div className='bg-fuchsia-100'></div>
				<div className='bg-fuchsia-200'></div>
				<div className='bg-fuchsia-300'></div>
				<div className='bg-fuchsia-400'></div>
				<div className='bg-fuchsia-500'></div>
				<div className='bg-fuchsia-600'></div>
				<div className='bg-fuchsia-700'></div>
				<div className='bg-fuchsia-800'></div>
				<div className='bg-fuchsia-900'></div>
				<div className='bg-fuchsia-950'></div>

				<div className='bg-pink-50'></div>
				<div className='bg-pink-100'></div>
				<div className='bg-pink-200'></div>
				<div className='bg-pink-300'></div>
				<div className='bg-pink-400'></div>
				<div className='bg-pink-500'></div>
				<div className='bg-pink-600'></div>
				<div className='bg-pink-700'></div>
				<div className='bg-pink-800'></div>
				<div className='bg-pink-900'></div>
				<div className='bg-pink-950'></div>

				<div className='bg-rose-50'></div>
				<div className='bg-rose-100'></div>
				<div className='bg-rose-200'></div>
				<div className='bg-rose-300'></div>
				<div className='bg-rose-400'></div>
				<div className='bg-rose-500'></div>
				<div className='bg-rose-600'></div>
				<div className='bg-rose-700'></div>
				<div className='bg-rose-800'></div>
				<div className='bg-rose-900'></div>
				<div className='bg-rose-950'></div>

				<div className='bg-slate-50'></div>
				<div className='bg-slate-100'></div>
				<div className='bg-slate-200'></div>
				<div className='bg-slate-300'></div>
				<div className='bg-slate-400'></div>
				<div className='bg-slate-500'></div>
				<div className='bg-slate-600'></div>
				<div className='bg-slate-700'></div>
				<div className='bg-slate-800'></div>
				<div className='bg-slate-900'></div>
				<div className='bg-slate-950'></div>

				<div className='bg-gray-50'></div>
				<div className='bg-gray-100'></div>
				<div className='bg-gray-200'></div>
				<div className='bg-gray-300'></div>
				<div className='bg-gray-400'></div>
				<div className='bg-gray-500'></div>
				<div className='bg-gray-600'></div>
				<div className='bg-gray-700'></div>
				<div className='bg-gray-800'></div>
				<div className='bg-gray-900'></div>
				<div className='bg-gray-950'></div>

				<div className='bg-zinc-50'></div>
				<div className='bg-zinc-100'></div>
				<div className='bg-zinc-200'></div>
				<div className='bg-zinc-300'></div>
				<div className='bg-zinc-400'></div>
				<div className='bg-zinc-500'></div>
				<div className='bg-zinc-600'></div>
				<div className='bg-zinc-700'></div>
				<div className='bg-zinc-800'></div>
				<div className='bg-zinc-900'></div>
				<div className='bg-zinc-950'></div>

				<div className='bg-neutral-50'></div>
				<div className='bg-neutral-100'></div>
				<div className='bg-neutral-200'></div>
				<div className='bg-neutral-300'></div>
				<div className='bg-neutral-400'></div>
				<div className='bg-neutral-500'></div>
				<div className='bg-neutral-600'></div>
				<div className='bg-neutral-700'></div>
				<div className='bg-neutral-800'></div>
				<div className='bg-neutral-900'></div>
				<div className='bg-neutral-950'></div>

				<div className='bg-stone-50'></div>
				<div className='bg-stone-100'></div>
				<div className='bg-stone-200'></div>
				<div className='bg-stone-300'></div>
				<div className='bg-stone-400'></div>
				<div className='bg-stone-500'></div>
				<div className='bg-stone-600'></div>
				<div className='bg-stone-700'></div>
				<div className='bg-stone-800'></div>
				<div className='bg-stone-900'></div>
				<div className='bg-stone-950'></div>
			</div>
		</div>
	)
}

export default ColorParent
