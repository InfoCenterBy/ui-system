import classNames from 'classnames'

// In-page anchors would change the router hash, scroll inside the preview instead
const handleAnchorClick = (e) => {
	const link = e.target.closest('a[href^="#"]')
	if (!link) return
	e.preventDefault()
	const id = link.getAttribute('href').slice(1)
	if (!id) return
	e.currentTarget
		.querySelector(`[id="${CSS.escape(id)}"]`)
		?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// Keep demo forms on the page, dialog forms still close their modal
const handleSubmit = (e) => {
	if (e.target.method !== 'dialog') e.preventDefault()
}

// transform-gpu keeps fixed elements like toast or dock inside the box
const HtmlPreview = ({ html, className }) => (
	<div
		className={classNames('transform-gpu', className)}
		onClick={handleAnchorClick}
		onSubmit={handleSubmit}
		dangerouslySetInnerHTML={{ __html: html }}
	/>
)

export default HtmlPreview
