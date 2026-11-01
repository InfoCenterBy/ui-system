import type { SectionCategory } from '@ui-system/blocks/sections'
import { tOr } from '@/i18n'

// Section presets and categories live in @ui-system/blocks, their English
// names are translated here by name or id, unknown ones stay as they are
export const sectionName = (name: string) => tOr(`sections.name.${name}`, name)

export const categoryName = (category: Pick<SectionCategory, 'id' | 'name'>) =>
	tOr(`sections.category.${category.id}`, category.name)

export const groupName = (id: string, name: string) =>
	tOr(`elements.group.${id}`, name)
