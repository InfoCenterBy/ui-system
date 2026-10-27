import CopyComponent from '../../copyComponent'
import PreviewHtmlComponent from '../../previewHtmlComponent'

const ComponentWrapperHtmlTab = ({
	components,
	htmlCodes,
	parsedHtml,
	updateHtmlCode,
}) => {
	return (
		<div className='tab-content rounded-lg bg-base-200 px-6 py-3 text-base-content'>
			{components.map((el) => (
				<CopyComponent
					objToCopy={
						htmlCodes[el.name]
							? parsedHtml(htmlCodes[el.name])
							: el.component
					}
					copyName={'html'}
					key={`html-${el.name}`}
				>
					<PreviewHtmlComponent
						htmlCode={htmlCodes[el.name]}
						setHtmlCode={(newHtml) =>
							updateHtmlCode(el.name, newHtml)
						}
						name={el.name}
					>
						{el.component}
					</PreviewHtmlComponent>
				</CopyComponent>
			))}
		</div>
	)
}

export default ComponentWrapperHtmlTab
