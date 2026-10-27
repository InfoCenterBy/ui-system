import { memo } from 'react'
import classNames from 'classnames'
import HtmlPreview from '../variant/htmlPreview'
import { PREVIEW_BOX } from '../variant/previewBox'
import { groupedCategories } from '../../../registry'
import dashboardHtml from './dashboard.html?raw'

// Rendered once, the theme only changes CSS variables on the wrapper
const Examples = memo(() =>
	groupedCategories.map((group) => (
		<section key={group.id} className='flex flex-col gap-8'>
			<h2 className='text-xl font-bold'>{group.name}</h2>
			{group.categories.map((category) => (
				<div
					key={category.slug}
					className='flex flex-col gap-3 [contain-intrinsic-size:auto_24rem] [content-visibility:auto]'
				>
					<h3 className='font-semibold'>{category.name}</h3>
					{category.variants.map((variant) => (
						<HtmlPreview
							key={variant.name}
							html={variant.html}
							className={classNames(
								PREVIEW_BOX,
								category.previewClass
							)}
						/>
					))}
				</div>
			))}
		</section>
	))
)

Examples.displayName = 'Examples'

const ThemePreview = ({ style, mode }) => (
	<div
		style={style}
		className='flex min-w-0 flex-col gap-12 rounded-box border border-base-300 bg-base-200 p-4 text-base-content lg:p-8'
	>
		{mode === 'dashboard' ? (
			<HtmlPreview html={dashboardHtml} />
		) : (
			<Examples />
		)}
	</div>
)

export default ThemePreview
