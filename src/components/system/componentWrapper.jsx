import { useState, useRef, useEffect } from 'react'
import CopyComponent from './copyComponent'
import PreviewHtmlComponent from './previewHtmlComponent'
import HTMLReactParser from 'html-react-parser'
import classNames from 'classnames'
import ComponentWrapperPreviewTab from './componentWrapper/preview/PreviewTab'
import ComponentWrapperHtmlTab from './componentWrapper/html/HtmlTab'
// import ComponentWrapperJsxTab from './componentWrapper/jsx/JsxTab'

const ComponentWrapper = ({
	// children,
	components,
	category,
	selectedComponent,
	setSelectedComponent,
}) => {
	const [htmlCodes, setHtmlCodes] = useState({})
	const [highlightedComponent, setHighlightedComponent] = useState(null)

	const previewTabRef = useRef(null)
	const htmlTabRef = useRef(null)
	// const jsxTabRef = useRef(null)
	const componentRefs = useRef([])

	useEffect(() => {
		if (
			selectedComponent?.category === category &&
			selectedComponent?.tab === 'preview' &&
			selectedComponent?.name &&
			!selectedComponent?.triggeredByUser // skip when the user switched tabs
		) {
			// Temporary until the wrapper rework in the components stage
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setHighlightedComponent(selectedComponent.name)
			const timer = setTimeout(() => {
				setHighlightedComponent(null)
			}, 1000)
			return () => clearTimeout(timer)
		}
	}, [selectedComponent, category])

	let parsedHtml = (code) => {
		return HTMLReactParser(code)
	}

	const updateHtmlCode = (componentName, newHtml) => {
		setHtmlCodes((prev) => ({
			...prev,
			[componentName]: newHtml,
		}))
	}

	const tabStyle =
		'[--tab-border-color:var(--fallback-bc,theme(colors.base-200))] text-base-content [--tab-bg:transparent] after:text-base-content hover:text-base-content'

	return (
		<div
			className='rounded-lg border border-base-content p-2'
			id={`${category}-component`}
		>
			<h4 className='h-4 font-semibold text-base-content'>{category}</h4>
			<div className='tabs tabs-border mt-2'>
				{/* Preview Tab */}
				<input
					type='radio'
					name={`code_tab_${category}`}
					className={classNames(tabStyle, 'tab')}
					aria-label='preview'
					ref={previewTabRef}
					checked={
						selectedComponent?.category === category &&
						selectedComponent?.tab === 'preview'
					}
					onChange={() =>
						setSelectedComponent &&
						setSelectedComponent((prev) => ({
							...prev,
							category,
							tab: 'preview',
							triggeredByUser: true,
						}))
					}
				/>
				<ComponentWrapperPreviewTab
					components={components}
					category={category}
					htmlCodes={htmlCodes}
					parsedHtml={parsedHtml}
					highlightedComponent={highlightedComponent}
					componentRefs={componentRefs}
				/>

				{/* HTML Tab */}
				<input
					type='radio'
					name={`code_tab_${category}`}
					className={classNames(tabStyle, 'tab')}
					aria-label='html'
					ref={htmlTabRef}
					checked={
						selectedComponent?.category === category &&
						selectedComponent?.tab === 'html'
					}
					onChange={() =>
						setSelectedComponent &&
						setSelectedComponent((prev) => ({
							...prev,
							category,
							tab: 'html',
						}))
					}
				/>
				<ComponentWrapperHtmlTab
					components={components}
					htmlCodes={htmlCodes}
					parsedHtml={parsedHtml}
					updateHtmlCode={updateHtmlCode}
				/>

				{/* JSX Tab */}
				{/*
				<input
					type='radio'
					name={`code_tab_${category}`}
					className={classNames(tabStyle, 'tab')}
					aria-label='jsx'
					ref={jsxTabRef}
					checked={
						selectedComponent?.category === category &&
						selectedComponent?.tab === 'jsx'
					}
					onChange={() =>
						setSelectedComponent &&
						setSelectedComponent((prev) => ({
							...prev,
							category,
							tab: 'jsx',
						}))
					}
				/>
				<ComponentWrapperJsxTab />
				*/}
			</div>
		</div>
	)
}

export default ComponentWrapper
