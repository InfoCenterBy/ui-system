import { beforeEach, describe, expect, it } from 'vitest'
import {
	findElement,
	parseSection,
	walk,
	type ElementNode,
	type Page,
	type Site,
	type TextNode,
} from '@ui-system/core'
import {
	addInstanceSection,
	createComponentFrom,
	deleteComponent,
	deleteSelected,
	detach,
	insertInstance,
	isComponentRoot,
	renameComponent,
	resetContent,
	setClasses,
	setSectionLocked,
	setSlotContent,
} from '@/store/actions'
import { useDocument } from '@/store/document'
import { dirtyKeys } from '@/store/history'
import { useProject } from '@/store/project'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home', 'about'],
}

const card = (id: string) =>
	parseSection({
		id,
		name: id,
		category: 'test',
		html: '<section class="p-4"><h2 data-edit="text">Title</h2><div class="box"><span>a</span></div></section>',
	})

const page = (id: string, slug: string, sections: ElementNode[]): Page => ({
	id,
	slug,
	name: id,
	meta: { title: id, description: '', ogImage: null },
	showHeader: true,
	showFooter: true,
	sections,
})

// Section ids are random, these are the first two sections of the home page
let A = ''
let B = ''

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [
			page('home', 'index', [card('a'), card('b')]),
			page('about', 'about', []),
		],
		partials: { header: null, footer: null },
		components: [],
	})
	;[A, B] = useDocument.getState().doc!.pages.home.sections.map((x) => x.id)
})

const doc = () => useDocument.getState().doc!
const home = () => doc().pages.home.sections
const text = (value: string): TextNode[] => [
	{ id: `t-${value}`, type: 'text', text: value },
]
const find = (root: ElementNode, tag: string) => {
	let found: ElementNode | null = null
	walk([root], (node) => {
		if (!found && node.type === 'element' && node.tag === tag) found = node
	})
	return found as ElementNode | null
}
const textOf = (root: ElementNode, tag = 'h2') => {
	const child = find(root, tag)?.children[0]
	return child?.type === 'text' ? child.text : ''
}

describe('createComponentFrom', () => {
	it('turns a section into a component and an instance', () => {
		const id = createComponentFrom(A, 'Card')
		const component = doc().components[id]
		expect(component.name).toBe('Card')
		expect(component.root.section?.locked).toBe(false)
		expect(component.root.instance).toBeUndefined()
		expect(home()[0].id).toBe(A)
		expect(home()[0].instance).toEqual({ component: id })
		expect(home()[0].section?.locked).toBe(true)
		expect(home()[0].ref).toBe(component.root.id)
		expect(isComponentRoot(doc(), component.root.id)).toBe(true)
		expect(useProject.getState().selectedId).toBe(A)
		expect(useDocument.getState().dirty).toContain(`component:${id}`)

		useDocument.getState().undo()
		expect(doc().components[id]).toBeUndefined()
		expect(home()[0].instance).toBeUndefined()
	})

	it('takes an element of an unlocked section', () => {
		setSectionLocked(A, false)
		const box = find(home()[0], 'div')!
		const id = createComponentFrom(box.id, 'Box')
		expect(doc().components[id].root.tag).toBe('div')
		expect(doc().components[id].root.section).toBeUndefined()
		expect(find(home()[0], 'div')?.instance).toEqual({ component: id })
	})

	it('rejects locked sections, instances and nesting', () => {
		const box = find(home()[0], 'div')!
		expect(() => createComponentFrom(box.id, 'Box')).toThrow(/locked/)
		expect(() => createComponentFrom(A, ' ')).toThrow(/name/)
		setSectionLocked(B, false)
		const inner = find(home()[1], 'div')!
		const id = createComponentFrom(inner.id, 'Box')
		const instance = find(home()[1], 'div')!
		// Parts of an instance and the instance itself cannot become components
		expect(() => createComponentFrom(instance.id, 'Again')).toThrow(
			/another component/
		)
		const span = find(instance, 'span')!
		expect(() => createComponentFrom(span.id, 'Again')).toThrow(/instance/)
		// A section that contains an instance cannot either
		expect(() => createComponentFrom(B, 'Page')).toThrow(
			/another component/
		)
		expect(Object.keys(doc().components)).toEqual([id])
	})
})

describe('master edits reach the instances', () => {
	const setUpTwo = () => {
		const id = createComponentFrom(A, 'Card')
		addInstanceSection(id)
		useProject.getState().setCurrentPage('about')
		const onAbout = addInstanceSection(id)!
		useProject.getState().setCurrentPage('home')
		return { id, onAbout }
	}

	it('updates instances on other pages, keeps overrides, one undo', () => {
		const { id, onAbout } = setUpTwo()
		const overridden = home()[2]
		// Override the title of the second instance on the home page
		const title = find(overridden, 'h2')!
		setSlotContent(title.id, text('Mine'))
		expect(textOf(home()[2])).toBe('Mine')

		useProject.getState().editComponent(id)
		const master = doc().components[id].root
		setSlotContent(find(master, 'h2')!.id, text('Shared'))
		const past = useDocument.getState().past.length

		expect(textOf(home()[0])).toBe('Shared')
		expect(textOf(doc().pages.about.sections[0])).toBe('Shared')
		expect(textOf(home()[2])).toBe('Mine')
		expect(doc().pages.about.sections[0].id).toBe(onAbout)
		expect(find(home()[0], 'h2')!.id).not.toBe(find(master, 'h2')!.id)
		const keys = dirtyKeys(
			useDocument.getState().past.at(-1)!.patches
		) as Set<string>
		expect(keys).toContain(`component:${id}`)
		expect(keys).toContain('page:about')

		useDocument.getState().undo()
		expect(useDocument.getState().past.length).toBe(past - 1)
		expect(textOf(doc().components[id].root)).toBe('Title')
		expect(textOf(home()[0])).toBe('Title')
		expect(textOf(doc().pages.about.sections[0])).toBe('Title')
		expect(textOf(home()[2])).toBe('Mine')

		useDocument.getState().redo()
		expect(textOf(doc().pages.about.sections[0])).toBe('Shared')
	})

	it('syncs structure changes made in component mode', () => {
		const { id } = setUpTwo()
		useProject.getState().editComponent(id)
		const master = doc().components[id].root
		const box = find(master, 'div')!
		setClasses(box.id, 'box big')
		expect(find(home()[0], 'div')?.classes).toBe('box big')
		deleteSelected()
		useProject.getState().select(box.id)
		deleteSelected()
		expect(find(home()[0], 'div')).toBeNull()
		expect(find(doc().pages.about.sections[0], 'div')).toBeNull()
		// The root of the master stays
		useProject.getState().select(master.id)
		deleteSelected()
		expect(doc().components[id].root.id).toBe(master.id)
	})
})

describe('instances', () => {
	it('adds, inserts, resets and detaches', () => {
		setSectionLocked(B, false)
		const box = find(home()[1], 'div')!
		const boxId = createComponentFrom(box.id, 'Box')
		const sectionId = createComponentFrom(A, 'Card')

		const parent = find(home()[1], 'section') ?? home()[1]
		const added = insertInstance(boxId, parent.id, 0)!
		expect(findElement(home(), added)?.instance).toEqual({
			component: boxId,
		})
		expect(() => insertInstance(sectionId, parent.id, 0)).toThrow(/section/)
		expect(() => addInstanceSection(boxId)).toThrow(/section/)
		// Locked sections and instance internals refuse instances
		expect(() => insertInstance(boxId, A, 0)).toThrow(/unlocked/)
		expect(() => insertInstance(boxId, added, 0)).toThrow(/instance/)

		const span = find(findElement(home(), added)!, 'span')!
		expect(span.ref).toBeDefined()
		const text0 = textOf(home()[0])
		const h2 = find(home()[0], 'h2')!
		setSlotContent(h2.id, text('Changed'))
		expect(textOf(home()[0])).toBe('Changed')
		resetContent(h2.id)
		expect(textOf(home()[0])).toBe(text0)
		useDocument.getState().undo()
		expect(textOf(home()[0])).toBe('Changed')

		detach(A)
		expect(home()[0].instance).toBeUndefined()
		expect(home()[0].ref).toBeUndefined()
		expect(home()[0].section?.locked).toBe(false)
		expect(find(home()[0], 'h2')?.slot).toBe('text')
		expect(() => detach(A)).toThrow(/instance/)
	})

	it('renames and deletes with one undo step', () => {
		const id = createComponentFrom(A, 'Card')
		addInstanceSection(id)
		useProject.getState().setCurrentPage('about')
		addInstanceSection(id)
		useProject.getState().setCurrentPage('home')
		renameComponent(id, ' Hero ')
		expect(doc().components[id].name).toBe('Hero')

		const past = useDocument.getState().past.length
		useProject.getState().editComponent(id)
		deleteComponent(id)
		expect(useProject.getState().editingComponentId).toBeNull()
		expect(doc().components[id]).toBeUndefined()
		for (const section of [...home(), ...doc().pages.about.sections]) {
			expect(section.instance).toBeUndefined()
			expect(section.ref).toBeUndefined()
			expect(find(section, 'h2')?.slot).toBe('text')
		}
		expect(useDocument.getState().dirty).toContain(`deletedComponent:${id}`)
		expect(useDocument.getState().past.length).toBe(past + 1)

		useDocument.getState().undo()
		expect(doc().components[id].name).toBe('Hero')
		expect(home()[0].instance).toEqual({ component: id })
		expect(doc().pages.about.sections[0].instance).toEqual({
			component: id,
		})
	})

	it('refuses instances while a master is edited', () => {
		const id = createComponentFrom(A, 'Card')
		useProject.getState().editComponent(id)
		expect(() => addInstanceSection(id)).toThrow(/inside a component/)
		expect(() => insertInstance(id, A, 0)).toThrow(/inside a component/)
		expect(() => detach(A)).toThrow(/inside a component/)
		expect(() => createComponentFrom(B, 'Other')).toThrow(
			/inside a component/
		)
	})
})
