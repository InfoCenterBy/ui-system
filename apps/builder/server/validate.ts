import type { ElementNode, Page, Site } from '@ui-system/core'
import { HttpError } from './errors'
import { isSafeId } from './fs-utils'

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
	return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function fail(what: string): never {
	throw new HttpError(400, `Invalid ${what}`)
}

export function assertSite(v: unknown): asserts v is Site {
	if (!isObj(v) || v.version !== 1) fail('site')
	for (const key of ['name', 'lang', 'pathPrefix']) {
		if (typeof v[key] !== 'string') fail(`site.${key}`)
	}
	if (!isObj(v.theme) || typeof v.theme.name !== 'string') fail('site.theme')
	if (!isObj(v.theme.vars)) fail('site.theme.vars')
	if (!isObj(v.fonts)) fail('site.fonts')
	if (!Array.isArray(v.pages) || !v.pages.every(isSafeId)) {
		fail('site.pages')
	}
}

export function assertElement(v: unknown): asserts v is ElementNode {
	if (!isObj(v) || v.type !== 'element') fail('element node')
	if (typeof v.id !== 'string' || typeof v.tag !== 'string') {
		fail('element node')
	}
	if (!Array.isArray(v.children)) fail('element node')
}

export function assertPage(v: unknown): asserts v is Page {
	if (!isObj(v) || !isSafeId(v.id)) fail('page')
	for (const key of ['slug', 'name']) {
		if (typeof v[key] !== 'string') fail(`page.${key}`)
	}
	if (!isObj(v.meta) || typeof v.meta.title !== 'string') fail('page.meta')
	if (typeof v.showHeader !== 'boolean') fail('page.showHeader')
	if (typeof v.showFooter !== 'boolean') fail('page.showFooter')
	if (!Array.isArray(v.sections)) fail('page.sections')
	v.sections.forEach(assertElement)
}

export function assertPartial(v: unknown): asserts v is ElementNode | null {
	if (v !== null) assertElement(v)
}

export function assertString(v: unknown, name: string): asserts v is string {
	if (typeof v !== 'string' || v.trim() === '') fail(name)
}
