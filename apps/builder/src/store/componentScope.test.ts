import { beforeEach, describe, expect, it } from 'vitest'
import {
	findElement,
	parseSection,
	walk,
	type ElementNode,
	type Site,
} from '@ui-system/core'
import {
	createComponentFrom,
	deleteNode,
	insertHtml,
	moveNodeTo,
	resetContent,
	setClasses,
	setSectionLocked,
	setSlotContent,
	wrapNode,
} from '@/store/actions'
import { overriddenIn } from '@/editor/components/instances'
import { useDocument } from '@/store/document'
import { useProject } from '@/store/project'

const site: Site = {
	version: 1,
	name: 'Test',
	lang: 'ru',
	pathPrefix: '',
	theme: { name: 'light', vars: {} },
	fonts: { heading: null, body: null },
	pages: ['home'],
}

const section = parseSection({
	id: 'a',
	name: 'a',
	category: 'test',
	html: '<section><h2 data-edit="text">Title</h2><div class="box"><span>a</span></div></section>',
})

beforeEach(() => {
	useProject.getState().openProject({
		path: '/p',
		site,
		pages: [
			{
				id: 'home',
				slug: 'index',
				name: 'home',
				meta: { title: 'h', description: '', ogImage: null },
				showHeader: true,
				showFooter: true,
				sections: [section],
			},
		],
		partials: { header: null, footer: null },
		components: [],
	})
})

const sections = () => useDocument.getState().doc!.pages.home.sections
const find = (tag: string) => {
	let found: ElementNode | null = null
	walk(sections(), (n) => {
		if (!found && n.type === 'element' && n.tag === tag) found = n
	})
	return found as ElementNode | null
}

describe('structure edits stay out of instances', () => {
	it('ignores class, move, wrap, insert and delete inside an instance', () => {
		const root = sections()[0].id
		setSectionLocked(root, false)
		createComponentFrom(find('div')!.id, 'Box')
		const instance = find('div')!
		const span = find('span')!
		const before = JSON.stringify(sections())
		setClasses(span.id, 'p-8')
		wrapNode(span.id)
		insertHtml(instance.id, 0, '<p>x</p>')
		moveNodeTo(span.id, root, 0)
		moveNodeTo(find('h2')!.id, instance.id, 0)
		deleteNode(span.id)
		expect(JSON.stringify(sections())).toBe(before)
	})

	it('still edits slots and moves the instance in free scope', () => {
		const root = sections()[0].id
		setSectionLocked(root, false)
		const id = createComponentFrom(find('div')!.id, 'Box')
		const instance = find('div')!
		const span = find('span')!
		setSlotContent(span.id, [{ id: 'n1', type: 'text', text: 'b' }])
		const master = useDocument.getState().doc!.components[id].root
		expect(overriddenIn(find('div')!, master)).toHaveLength(1)
		resetContent(span.id)
		expect(overriddenIn(find('div')!, master)).toHaveLength(0)
		moveNodeTo(instance.id, root, 0)
		expect(findElement(sections(), instance.id)).not.toBeNull()
		expect(sections()[0].children[0]).toMatchObject({ id: instance.id })
	})

	it('edits freely in the master while a component is edited', () => {
		const root = sections()[0].id
		setSectionLocked(root, false)
		const id = createComponentFrom(find('div')!.id, 'Box')
		useProject.getState().editComponent(id)
		const master = useDocument.getState().doc!.components[id].root
		const inner = master.children.find((c) => c.type === 'element')!
		setClasses(inner.id, 'p-2')
		const next = useDocument.getState().doc!.components[id].root
		const changed = next.children.find((c) => c.type === 'element')!
		expect(changed.type === 'element' && changed.classes).toBe('p-2')
	})
})
