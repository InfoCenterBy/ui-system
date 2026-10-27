import { html_beautify } from 'js-beautify'
import ReactDOMServer from 'react-dom/server'

const PreviewHtmlComponent = ({ children, htmlCode, setHtmlCode, name }) => {
	const htmlRender = (code) => {
		return ReactDOMServer.renderToStaticMarkup(code)
	}
	const formattedHtml = html_beautify(htmlRender(children), {
		// indent_size: 5,y
		// indent_char: ' ',
		// preserve_newlines: true,
	})
	return (
		<>
			<div className=''>
				<div className='pointer-none block text-sm text-base-content italic opacity-60 select-none'>
					{name}
				</div>
				<textarea
					className='w-full resize-none rounded-[.75rem] bg-base-100 p-2 text-base-content focus-within:outline-0'
					rows='7'
					onChange={(e) => setHtmlCode(e.target.value)}
					defaultValue={htmlCode ? htmlCode : formattedHtml}
				></textarea>
			</div>
		</>
	)
}

export default PreviewHtmlComponent
