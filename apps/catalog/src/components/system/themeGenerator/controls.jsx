import classNames from 'classnames'
import ColorSwatch from './colorSwatch'
import ContrastSummary from './contrastSummary'
import { isReadable } from '@ui-system/theme'
import {
	PRESET_NAMES,
	getColor,
	setAuto,
	setColor,
	setVar,
} from '@ui-system/theme'

const BASE_COLORS = ['base-100', 'base-200', 'base-300']

const PAIRED_COLORS = [
	['primary', 'Primary'],
	['secondary', 'Secondary'],
	['accent', 'Accent'],
	['neutral', 'Neutral'],
	['info', 'Info'],
	['success', 'Success'],
	['warning', 'Warning'],
	['error', 'Error'],
]

const RADIUS_GROUPS = [
	['--radius-selector', 'Selectors', 'checkbox, toggle, badge'],
	['--radius-field', 'Fields', 'button, input, select, tab'],
	['--radius-box', 'Boxes', 'card, modal, alert'],
]

const RADIUS = ['0rem', '0.25rem', '0.5rem', '1rem', '2rem']

const SIZES = [
	['0.1875rem', 'XS'],
	['0.21875rem', 'S'],
	['0.25rem', 'M'],
	['0.28125rem', 'L'],
	['0.3125rem', 'XL'],
]

const BORDERS = ['0.5px', '1px', '1.5px', '2px']

const Section = ({ title, children }) => (
	<section className='flex flex-col gap-3'>
		<h2 className='text-xs font-semibold tracking-wide text-base-content/60 uppercase'>
			{title}
		</h2>
		{children}
	</section>
)

const Segmented = ({ label, options, value, onChange }) => (
	<div>
		<div className='mb-1 text-sm'>{label}</div>
		<div className='join w-full'>
			{options.map(([optionValue, content]) => (
				<button
					key={optionValue}
					className={classNames('btn join-item flex-1 btn-sm', {
						'btn-active btn-primary': optionValue === value,
					})}
					aria-pressed={optionValue === value}
					onClick={() => onChange(optionValue)}
				>
					{content}
				</button>
			))}
		</div>
	</div>
)

const RadiusIcon = ({ radius }) => (
	<span
		className='size-4 border-t-2 border-l-2 border-current'
		style={{ borderTopLeftRadius: `calc(${radius} * 1.5)` }}
	/>
)

// Content swatch with an auto toggle and a contrast warning
const ContentControl = ({ theme, contentKey, bgKey, onChange }) => {
	const readable = isReadable(
		getColor(theme, bgKey),
		getColor(theme, contentKey)
	)
	return (
		<div className='flex items-center gap-2'>
			{!readable && (
				<span
					className='badge badge-soft badge-xs badge-warning'
					title='Contrast below 4.5:1'
				>
					low
				</span>
			)}
			<label
				className='flex cursor-pointer items-center gap-1 text-xs text-base-content/60'
				title='Pick a readable content color automatically'
			>
				<input
					type='checkbox'
					className='toggle toggle-xs'
					checked={theme.auto[contentKey]}
					onChange={(e) =>
						onChange(setAuto(theme, contentKey, e.target.checked))
					}
				/>
				auto
			</label>
			<ColorSwatch
				label={contentKey}
				value={getColor(theme, contentKey)}
				onChange={(value) =>
					onChange(setColor(theme, contentKey, value))
				}
				className='size-6'
			/>
		</div>
	)
}

const Controls = ({ theme, onChange, onPreset }) => {
	const update = (key, value) => onChange(setVar(theme, key, value))
	const changeColor = (key) => (value) =>
		onChange(setColor(theme, key, value))

	return (
		<div className='flex flex-col gap-6'>
			<Section title='Theme'>
				<label className='floating-label'>
					<span>Name</span>
					<input
						className='input w-full'
						value={theme.name}
						placeholder='mytheme'
						onChange={(e) =>
							onChange({
								...theme,
								name: e.target.value
									.toLowerCase()
									.replace(/[^a-z0-9-]/g, ''),
							})
						}
					/>
				</label>
				<label className='floating-label'>
					<span>Start from</span>
					<select
						className='select w-full'
						value={theme.preset}
						onChange={(e) => onPreset(e.target.value)}
					>
						{PRESET_NAMES.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>
				</label>
				<Segmented
					label='Color scheme'
					value={theme.vars['color-scheme']}
					options={[
						['light', 'Light'],
						['dark', 'Dark'],
					]}
					onChange={(value) => update('color-scheme', value)}
				/>
			</Section>

			<Section title='Base colors'>
				<div className='flex items-center gap-2'>
					{BASE_COLORS.map((key) => (
						<ColorSwatch
							key={key}
							label={key}
							value={getColor(theme, key)}
							onChange={changeColor(key)}
						/>
					))}
					<span className='ms-auto'>
						<ContentControl
							theme={theme}
							contentKey='base-content'
							bgKey='base-100'
							onChange={onChange}
						/>
					</span>
				</div>
			</Section>

			<Section title='Colors'>
				{PAIRED_COLORS.map(([key, label]) => (
					<div key={key} className='flex items-center gap-3'>
						<ColorSwatch
							label={key}
							value={getColor(theme, key)}
							onChange={changeColor(key)}
						/>
						<span className='text-sm'>{label}</span>
						<span className='ms-auto'>
							<ContentControl
								theme={theme}
								contentKey={`${key}-content`}
								bgKey={key}
								onChange={onChange}
							/>
						</span>
					</div>
				))}
			</Section>

			<Section title='Contrast'>
				<ContrastSummary theme={theme} onChange={onChange} />
			</Section>

			<Section title='Radius'>
				{RADIUS_GROUPS.map(([key, label, hint]) => (
					<Segmented
						key={key}
						label={
							<>
								{label}{' '}
								<span className='text-xs text-base-content/50'>
									{hint}
								</span>
							</>
						}
						value={theme.vars[key]}
						options={RADIUS.map((r) => [
							r,
							<RadiusIcon key={r} radius={r} />,
						])}
						onChange={(value) => update(key, value)}
					/>
				))}
			</Section>

			<Section title='Sizes'>
				<Segmented
					label='Selectors'
					value={theme.vars['--size-selector']}
					options={SIZES}
					onChange={(value) => update('--size-selector', value)}
				/>
				<Segmented
					label='Fields'
					value={theme.vars['--size-field']}
					options={SIZES}
					onChange={(value) => update('--size-field', value)}
				/>
			</Section>

			<Section title='Effects'>
				<Segmented
					label='Border width'
					value={theme.vars['--border']}
					options={BORDERS.map((b) => [b, b])}
					onChange={(value) => update('--border', value)}
				/>
				<label className='flex cursor-pointer items-center justify-between text-sm'>
					Depth
					<input
						type='checkbox'
						className='toggle toggle-sm'
						checked={theme.vars['--depth'] === '1'}
						onChange={(e) =>
							update('--depth', e.target.checked ? '1' : '0')
						}
					/>
				</label>
			</Section>
		</div>
	)
}

export default Controls
