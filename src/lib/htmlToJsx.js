const INDENT = '\t'
const MAX_LINE = 80

const VOID_TAGS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'track',
	'wbr',
])

const ATTR_NAMES = {
	class: 'className',
	for: 'htmlFor',
	tabindex: 'tabIndex',
	readonly: 'readOnly',
	maxlength: 'maxLength',
	minlength: 'minLength',
	autocomplete: 'autoComplete',
	autofocus: 'autoFocus',
	colspan: 'colSpan',
	rowspan: 'rowSpan',
	contenteditable: 'contentEditable',
	crossorigin: 'crossOrigin',
	enterkeyhint: 'enterKeyHint',
	inputmode: 'inputMode',
	novalidate: 'noValidate',
	popovertarget: 'popoverTarget',
	popovertargetaction: 'popoverTargetAction',
	spellcheck: 'spellCheck',
	srcset: 'srcSet',
	datetime: 'dateTime',
	formaction: 'formAction',
	formnovalidate: 'formNoValidate',
	allowfullscreen: 'allowFullScreen',
	playsinline: 'playsInline',
	'xlink:href': 'xlinkHref',
	'xml:space': 'xmlSpace',
}

const BOOLEAN_ATTRS = new Set([
	'disabled',
	'required',
	'readOnly',
	'multiple',
	'hidden',
	'open',
	'autoFocus',
	'noValidate',
	'formNoValidate',
	'allowFullScreen',
	'controls',
	'loop',
	'muted',
	'autoPlay',
	'inert',
	'playsInline',
	'default',
	'reversed',
	'defaultChecked',
])

const camelCase = (name) =>
	name.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase())

const jsxAttrName = (name) => {
	if (ATTR_NAMES[name]) return ATTR_NAMES[name]
	if (name.startsWith('aria-') || name.startsWith('data-')) return name
	if (name.startsWith('on'))
		return 'on' + name[2].toUpperCase() + name.slice(3)
	if (name === 'autoplay') return 'autoPlay'
	return name.includes('-') ? camelCase(name) : name
}

const quote = (value) =>
	value.includes('"') ? `{${JSON.stringify(value)}}` : `"${value}"`

const styleToObject = (css) => {
	const entries = css
		.split(';')
		.map((rule) => rule.trim())
		.filter(Boolean)
		.map((rule) => {
			const i = rule.indexOf(':')
			const prop = rule.slice(0, i).trim()
			const value = rule.slice(i + 1).trim()
			const key = prop.startsWith('--')
				? `'${prop}'`
				: camelCase(prop.replace(/^-ms-/, 'ms-'))
			return `${key}: ${JSON.stringify(value).replace(/^"|"$/g, "'")}`
		})
	return `{{ ${entries.join(', ')} }}`
}

const handlerToJsx = (code) => {
	const body = code.trim().replace(/;$/, '')
	return body.includes(';') ? `{() => { ${body} }}` : `{() => ${body}}`
}

// Moves form state attributes to their uncontrolled React props
const attributesOf = (el) => {
	const tag = el.localName
	const attrs = []
	for (const { name, value } of el.attributes) {
		let jsxName = jsxAttrName(name)
		if (tag === 'input' && name === 'checked') jsxName = 'defaultChecked'
		if (tag === 'input' && name === 'value') jsxName = 'defaultValue'
		if (tag === 'option' && name === 'selected') continue
		attrs.push([jsxName, value])
	}
	if (tag === 'select') {
		const selected = el.querySelector('option[selected]')
		if (selected) {
			attrs.push([
				'defaultValue',
				selected.getAttribute('value') ?? selected.textContent.trim(),
			])
		}
	}
	if (tag === 'textarea' && el.textContent.trim()) {
		attrs.push(['defaultValue', el.textContent.trim()])
	}
	return attrs.map(([name, value]) => {
		if (name === 'style') return `style=${styleToObject(value)}`
		if (/^on[A-Z]/.test(name)) return `${name}=${handlerToJsx(value)}`
		if (value === '' && BOOLEAN_ATTRS.has(name)) return name
		return `${name}=${quote(value)}`
	})
}

const escapeText = (text) =>
	text.replace(/[{}<>]/g, (c) => `{'${c}'}`).replace(/\u00a0/g, '&nbsp;')

const isBlank = (node) => node.nodeType === 3 && !node.textContent.trim()

const renderNode = (node, depth, prev, next) => {
	const pad = INDENT.repeat(depth)
	if (node.nodeType === 3) {
		const raw = node.textContent.replace(/\s+/g, ' ')
		let text = escapeText(raw.trim())
		if (prev && raw.startsWith(' ')) text = `{' '}${text}`
		if (next && raw.endsWith(' ')) text = `${text}{' '}`
		return pad + text
	}
	if (node.nodeType === 8) {
		return `${pad}{/* ${node.textContent.trim()} */}`
	}
	if (node.nodeType !== 1) return null

	const tag = node.localName
	// JSX never runs inline scripts, point to the React way instead
	if (tag === 'script') {
		return `${pad}{/* Script from the HTML example is not included, run it in useEffect */}`
	}
	const attrs = attributesOf(node)
	const children =
		tag === 'textarea'
			? []
			: [...node.childNodes].filter((child) => !isBlank(child))

	const inlineAttrs = attrs.length ? ' ' + attrs.join(' ') : ''
	const multilineAttrs = attrs.map((a) => `\n${pad}${INDENT}${a}`).join('')
	const fits = (s) => pad.length * 4 + s.length <= MAX_LINE

	const openTag = (end) =>
		fits(`<${tag}${inlineAttrs}${end}`)
			? `${pad}<${tag}${inlineAttrs}${end}`
			: `${pad}<${tag}${multilineAttrs}\n${pad}${end.trim()}`

	if (children.length === 0 || VOID_TAGS.has(tag)) return openTag(' />')

	const onlyText = children.length === 1 && children[0].nodeType === 3
	if (onlyText) {
		const text = escapeText(
			children[0].textContent.replace(/\s+/g, ' ').trim()
		)
		const line = `<${tag}${inlineAttrs}>${text}</${tag}>`
		if (fits(line)) return pad + line
	}

	const body = children
		.map((child, i) =>
			renderNode(child, depth + 1, children[i - 1], children[i + 1])
		)
		.filter(Boolean)
		.join('\n')
	return `${openTag('>')}\n${body}\n${pad}</${tag}>`
}

// Converts an HTML snippet to JSX markup
export const htmlToJsx = (html) => {
	const template = document.createElement('template')
	template.innerHTML = html.trim()
	const nodes = [...template.content.childNodes].filter((n) => !isBlank(n))
	if (nodes.length === 1) return renderNode(nodes[0], 0)
	const body = nodes
		.map((node, i) => renderNode(node, 1, nodes[i - 1], nodes[i + 1]))
		.join('\n')
	return `<>\n${body}\n</>`
}
