import { beforeEach, describe, expect, it } from 'vitest'
import {
	parseSection,
	walk,
	type ElementNode,
	type Page,
	type Site,
} from '@ui-system/core'
import {
	createComponentFrom,
	setClasses,
	setSlotContent,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'
import {
	addProp,
	addVariant,
	deleteVariant,
	removeProp,
	renameVariant,
	setInstanceHidden,
	setInstanceVariant,
	variantUsage,
} from '@/store/variantActions'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home'],
}

const card = () =>
	parseSection({
		id: 'a',
		name: 'a',
		category: 'test',
		html: '<section class="bg-white p-4"><h2 data-edit="text" class="font-bold">Title</h2><a href="/x" class="btn">Go</a></section>',
	})

const page = (): Page => ({
	id: 'home',
	slug: 'index',
	name: 'Home',
	meta: { title: 'Home', description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections: [card()],
})

const doc = () => useDocument.getState().doc!
const home = () => doc().pages.home.sections
const tag = (root: ElementNode, name: string) => {
	let found: ElementNode | null = null
	walk([root], (n) => {
		if (!found && n.type === 'element' && n.tag === name) found = n
	})
	return found as ElementNode | null
}
const tokens = (classes: string) => classes.split(' ').sort()
const project = () => useProject.getState()

let componentId = ''
let sectionId = ''

beforeEach(() => {
	project().openProject({
		path: '/p',
		site,
		pages: [page()],
		partials: { header: null, footer: null },
		components: [],
	})
	sectionId = home()[0].id
	componentId = createComponentFrom(sectionId, 'Card')
})

const master = () => doc().components[componentId].root
const variants = () => doc().components[componentId].variants

// Edits the master while a variant is active
const editVariant = (variantId: string, classes: string) => {
	project().editComponent(componentId)
	project().setEditingVariant(variantId)
	setClasses(master().id, classes)
}

describe('variant editing', () => {
	it('routes class edits into the variant diff, not the base', () => {
		const variantId = addVariant(componentId, 'Dark')
		editVariant(variantId, 'bg-black p-4')
		expect(master().classes).toBe('bg-white p-4')
		expect(variants()?.[0].diffs).toEqual({
			[master().id]: { add: ['bg-black'], remove: ['bg-white'] },
		})
		// Instances on the base look are untouched
		expect(home()[0].classes).toBe('bg-white p-4')
	})

	it('writes to the base when no variant is active', () => {
		addVariant(componentId, 'Dark')
		project().editComponent(componentId)
		setClasses(master().id, 'bg-red-500 p-4')
		expect(master().classes).toBe('bg-red-500 p-4')
		expect(variants()?.[0].diffs).toEqual({})
	})

	it('drops a diff again when the edit restores the base', () => {
		const variantId = addVariant(componentId, 'Dark')
		editVariant(variantId, 'bg-black p-4')
		setClasses(master().id, 'bg-white p-4')
		expect(variants()?.[0].diffs).toEqual({})
	})

	it('undo restores the variant and the instances', () => {
		const variantId = addVariant(componentId, 'Dark')
		editVariant(variantId, 'bg-black p-4')
		setInstanceVariant(sectionId, variantId)
		expect(tokens(home()[0].classes)).toEqual(['bg-black', 'p-4'])
		useDocument.getState().undo()
		expect(home()[0].classes).toBe('bg-white p-4')
		expect(home()[0].instance?.variant).toBeUndefined()
		useDocument.getState().undo()
		expect(variants()?.[0].diffs).toEqual({})
		useDocument.getState().undo()
		expect(variants()).toBeUndefined()
	})

	it('leaving component mode forgets the active variant', () => {
		const variantId = addVariant(componentId, 'Dark')
		editVariant(variantId, 'bg-black p-4')
		project().exitComponent()
		expect(project().editingVariantId).toBeNull()
	})
})

describe('instance variant', () => {
	it('changes the look and keeps text overrides', () => {
		const variantId = addVariant(componentId, 'Dark')
		editVariant(variantId, 'bg-black p-4')
		project().exitComponent()
		setSlotContent(tag(home()[0], 'h2')!.id, [
			{ id: 'tx', type: 'text', text: 'Mine' },
		])
		setInstanceVariant(sectionId, variantId)
		const instance = home()[0]
		expect(instance.id).toBe(sectionId)
		expect(instance.instance?.variant).toBe(variantId)
		expect(tokens(instance.classes)).toEqual(['bg-black', 'p-4'])
		const text = tag(instance, 'h2')!.children[0]
		expect(text.type === 'text' && text.text).toBe('Mine')
		setInstanceVariant(sectionId, null)
		expect(home()[0].classes).toBe('bg-white p-4')
		expect(home()[0].instance).toEqual({ component: componentId })
	})

	it('later base edits reach a variant instance', () => {
		const variantId = addVariant(componentId, 'Dark')
		editVariant(variantId, 'bg-black p-4')
		project().setEditingVariant(null)
		setClasses(master().id, 'bg-white p-8')
		setInstanceVariant(sectionId, variantId)
		expect(tokens(home()[0].classes)).toEqual(['bg-black', 'p-8'])
	})

	it('deleting a variant sends instances back to the base', () => {
		const variantId = addVariant(componentId, 'Dark')
		setInstanceVariant(sectionId, variantId)
		expect(variantUsage(doc(), componentId, variantId)).toEqual({
			count: 1,
			places: ['Home'],
		})
		deleteVariant(componentId, variantId)
		expect(variants()).toEqual([])
		expect(home()[0].instance).toEqual({ component: componentId })
		useDocument.getState().undo()
		expect(home()[0].instance?.variant).toBe(variantId)
	})

	it('duplicates and renames variants', () => {
		const a = addVariant(componentId, 'A')
		editVariant(a, 'bg-black p-4')
		const b = addVariant(componentId, 'B', a)
		renameVariant(componentId, b, 'Copy')
		const list = variants()!
		expect(list[1].name).toBe('Copy')
		expect(list[1].diffs).toEqual(list[0].diffs)
		expect(() => addVariant(componentId, ' ')).toThrow()
	})
})

describe('properties', () => {
	it('hides an element in one instance only', () => {
		const link = tag(master(), 'a')!
		addProp(componentId, link.id, 'visibility', 'Button')
		setInstanceHidden(sectionId, link.id, true)
		expect(tag(home()[0], 'a')).toBeNull()
		expect(home()[0].instance?.hidden).toEqual([link.id])
		setInstanceHidden(sectionId, link.id, false)
		expect(tag(home()[0], 'a')).not.toBeNull()
		useDocument.getState().undo()
		expect(tag(home()[0], 'a')).toBeNull()
	})

	it('removing a property shows the element again', () => {
		const link = tag(master(), 'a')!
		addProp(componentId, link.id, 'visibility', 'Button')
		setInstanceHidden(sectionId, link.id, true)
		removeProp(componentId, doc().components[componentId].props![0].id)
		expect(tag(home()[0], 'a')).not.toBeNull()
		expect(home()[0].instance?.hidden).toBeUndefined()
	})

	it('rejects kinds the element cannot have and empty labels', () => {
		const h2 = tag(master(), 'h2')!
		expect(() => addProp(componentId, h2.id, 'image', 'x')).toThrow()
		expect(() => addProp(componentId, h2.id, 'text', ' ')).toThrow()
		addProp(componentId, h2.id, 'text', 'Heading')
		addProp(componentId, h2.id, 'text', 'Again')
		expect(doc().components[componentId].props).toHaveLength(1)
	})
})
