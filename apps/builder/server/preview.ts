import {
	BODY_CLASSES,
	MAIN_CLASSES,
	collectClasses,
	resolveLayout,
	revealCss,
	type ElementNode,
	type Page,
} from '@ui-system/core'
import {
	CALLY_FILE,
	pageBody,
	pageDocument,
	pageParts,
	siteScript,
	takeScripts,
} from './export'
import type { Project } from './project'
import { detectFeatures, featureScripts } from './siteScripts'

const ASSET = /^assets\//

// Roots of a page after the export's header handling, with inline scripts taken out
const prepare = (project: Project, page: Page) => {
	const parts = pageParts(project, page)
	const roots: ElementNode[] = [
		...(parts.header ? [parts.header] : []),
		...parts.sections,
		...(parts.footer ? [parts.footer] : []),
	]
	const scripts = takeScripts(roots)
	const features = detectFeatures(roots)
	scripts.push(...featureScripts(features))
	return { parts, roots, scripts, features }
}

// The page as the export writes it, but with relative urls to the project's own
// files and no image optimization. Null for an unknown slug
export const previewHtml = (project: Project, slug: string) => {
	const page = project.pages.find((p) => p.slug === slug)
	if (!page) return null
	const { site } = project
	const { stickyFooter } = resolveLayout(site.layout)
	const { parts, scripts, features } = prepare(project, page)
	return pageDocument({
		site,
		page,
		body: pageBody(parts, stickyFooter),
		bodyClass: stickyFooter ? BODY_CLASSES : '',
		prefix: '',
		script: scripts.length > 0,
		cally: features.calendar,
		reveal: features.reveal,
		favicon:
			site.favicon && ASSET.test(site.favicon) ? site.favicon : undefined,
	})
}

// Classes and scripts of the whole site, like the single files of the export
export const previewSiteAssets = (project: Project) => {
	const classes = new Set<string>()
	const scripts: string[] = []
	let reveal = false
	if (resolveLayout(project.site.layout).stickyFooter) {
		for (const name of `${BODY_CLASSES} ${MAIN_CLASSES}`.split(' ')) {
			classes.add(name)
		}
	}
	for (const id of project.site.pages) {
		const page = project.pages.find((p) => p.id === id)
		if (!page) continue
		const prepared = prepare(project, page)
		collectClasses(prepared.roots, classes)
		scripts.push(...prepared.scripts)
		reveal ||= prepared.features.reveal
	}
	return {
		classes,
		script: siteScript(scripts),
		extraCss: reveal ? revealCss() : '',
	}
}

export { CALLY_FILE }
