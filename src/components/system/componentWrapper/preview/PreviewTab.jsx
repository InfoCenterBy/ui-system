import CopyComponent from '../../copyComponent'
import classNames from 'classnames'

const ComponentWrapperPreviewTab = ({
	components,
	category,
	htmlCodes,
	parsedHtml,
	highlightedComponent,
	componentRefs,
}) => {
	return (
		<div className='tab-content rounded-lg bg-base-300 px-6 py-3'>
			<div className='flex flex-wrap gap-6'>
				{components.map((el, idx) => (
					<CopyComponent
						objToCopy={
							htmlCodes[el.name]
								? parsedHtml(htmlCodes[el.name])
								: el.component
						}
						copyName={'html'}
						key={`preview-${el.name}`}
						id={`${el.name ? category + '-' + el.name : category}`}
						name={el.name}
					>
						<div
							className={classNames(
								'w-fit rounded-lg border p-2 duration-300 ease-out',
								{
									'border-base-content':
										highlightedComponent === el.name,
									'border-transparent':
										highlightedComponent !== el.name,
								}
							)}
							tabIndex={-1}
							ref={
								el.name
									? (el) => (componentRefs.current[idx] = el)
									: null
							}
						>
							{htmlCodes[el.name]
								? parsedHtml(htmlCodes[el.name])
								: el.component}
						</div>
					</CopyComponent>
				))}
			</div>
		</div>
	)
}

export default ComponentWrapperPreviewTab
