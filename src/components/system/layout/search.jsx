import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import Icon from '../icon'
import { categories, categoryPath, groups, pages } from '../../../registry'

const groupName = (id) => groups.find((g) => g.id === id)?.name

const PAGE_ITEMS = pages.map((page) => ({
	id: page.path,
	label: page.name,
	hint: 'Page',
	to: page.path,
}))

const CATEGORY_ITEMS = [...categories]
	.sort((a, b) => a.name.localeCompare(b.name))
	.map((category) => ({
		id: category.slug,
		label: category.name,
		hint: groupName(category.group),
		to: categoryPath(category.slug),
	}))

const VARIANT_ITEMS = categories.flatMap((category) =>
	category.variants.map((variant) => ({
		id: `${category.slug}/${variant.name}`,
		label: `${category.name} / ${variant.title}`,
		hint: 'Variant',
		to: `${categoryPath(category.slug)}?v=${variant.name}`,
	}))
)

const ALL_ITEMS = [...PAGE_ITEMS, ...CATEGORY_ITEMS, ...VARIANT_ITEMS]

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.userAgent)

// Every word of the query must appear in the label
const filterItems = (query) => {
	const words = query.toLowerCase().split(/\s+/).filter(Boolean)
	if (words.length === 0) return [...PAGE_ITEMS, ...CATEGORY_ITEMS]
	return ALL_ITEMS.filter((item) =>
		words.every((word) => item.label.toLowerCase().includes(word))
	)
}

const Search = () => {
	const [query, setQuery] = useState('')
	const [activeIndex, setActiveIndex] = useState(0)
	const dialogRef = useRef(null)
	const listRef = useRef(null)
	const navigate = useNavigate()

	const results = useMemo(() => filterItems(query), [query])

	const open = () => {
		setQuery('')
		setActiveIndex(0)
		dialogRef.current?.showModal()
	}

	const go = (item) => {
		dialogRef.current?.close()
		navigate(item.to)
	}

	useEffect(() => {
		const onKeyDown = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				open()
			}
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	useEffect(() => {
		listRef.current
			?.querySelector('[data-active="true"]')
			?.scrollIntoView({ block: 'nearest' })
	}, [activeIndex])

	const onInputKeyDown = (e) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setActiveIndex((i) => Math.min(i + 1, results.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActiveIndex((i) => Math.max(i - 1, 0))
		} else if (e.key === 'Enter' && results[activeIndex]) {
			e.preventDefault()
			go(results[activeIndex])
		}
	}

	return (
		<>
			<button
				className='btn gap-3 btn-ghost max-sm:btn-square sm:w-64 sm:justify-start sm:bg-base-200'
				onClick={open}
				aria-label='Search components'
			>
				<Icon name='search' className='size-4' />
				<span className='font-normal opacity-60 max-sm:hidden'>
					Search
				</span>
				<span className='ms-auto flex gap-1 max-sm:hidden'>
					<kbd className='kbd kbd-sm'>{IS_MAC ? '⌘' : 'Ctrl'}</kbd>
					<kbd className='kbd kbd-sm'>K</kbd>
				</span>
			</button>
			<dialog ref={dialogRef} className='modal modal-top sm:modal-middle'>
				<div className='modal-box flex max-h-[70vh] flex-col gap-2 p-3 sm:max-w-xl'>
					<label className='input w-full'>
						<Icon name='search' className='size-4 opacity-60' />
						<input
							type='search'
							placeholder='Search components'
							value={query}
							autoFocus
							onChange={(e) => {
								setQuery(e.target.value)
								setActiveIndex(0)
							}}
							onKeyDown={onInputKeyDown}
						/>
					</label>
					<ul
						ref={listRef}
						className='menu w-full flex-nowrap overflow-y-auto'
					>
						{results.length === 0 && (
							<li className='menu-disabled'>
								<span>Nothing found</span>
							</li>
						)}
						{results.map((item, index) => (
							<li key={item.id}>
								<button
									data-active={index === activeIndex}
									className={classNames('justify-between', {
										'menu-active': index === activeIndex,
									})}
									onMouseMove={() => setActiveIndex(index)}
									onClick={() => go(item)}
								>
									<span>{item.label}</span>
									<span className='text-xs opacity-60'>
										{item.hint}
									</span>
								</button>
							</li>
						))}
					</ul>
				</div>
				<form method='dialog' className='modal-backdrop'>
					<button>close</button>
				</form>
			</dialog>
		</>
	)
}

export default Search
