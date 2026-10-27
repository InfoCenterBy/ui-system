import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	sortableKeyboardCoordinates,
	rectSortingStrategy,
} from '@dnd-kit/sortable'
import GridItem from '../components/system/dnd/gridItem'
import GridCell from '../components/system/dnd/gridCell'
import { useState } from 'react'
import { Item } from '../components/system/dnd/item'

const TestPage = () => {
	const [items, setItems] = useState([
		{ id: '1', position: { x: 0, y: 0 } },
		{ id: '2', position: { x: 1, y: 0 } },
		{ id: '3', position: { x: 2, y: 0 } },
		{ id: '4', position: { x: 0, y: 1 } },
		{ id: '5', position: { x: 1, y: 1 } },
	])
	const [activeId, setActiveId] = useState(null)

	// Grid height follows the lowest item
	const maxY = Math.max(...items.map((item) => item.position.y), 0)
	const gridRows = maxY + 2 // One spare row to drop into
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)
	function handleDragStart(event) {
		const { active } = event

		setActiveId(active.id)
	}
	function handleDragEnd(event) {
		const { active, over } = event

		if (active.id !== over?.id && over?.id) {
			const cellId = over.id

			if (cellId.startsWith('cell-')) {
				const cellIndex = parseInt(cellId.replace('cell-', ''))
				const x = cellIndex % 12
				const y = Math.floor(cellIndex / 12)

				// Allow any cell in the grid or one row below to extend it
				if (x >= 0 && x < 12 && y >= 0 && y <= maxY + 1) {
					setItems((prevItems) => {
						return prevItems.map((item) =>
							item.id === active.id
								? { ...item, position: { x, y } }
								: item
						)
					})
				}
			}
		}

		setActiveId(null)
	}

	return (
		<>
			<div>
				<div className='flex h-full w-full flex-row flex-wrap content-start items-start gap-x-6 pt-2 lg:flex-nowrap'>
					<div className='w-full'>
						<div className='bg-base-100 p-4'>
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={items.map((item) => item.id)}
									strategy={rectSortingStrategy}
								>
									<div
										className='grid w-full gap-2'
										style={{
											gridTemplateColumns:
												'repeat(12, 1fr)',
											gridTemplateRows: `repeat(${gridRows - 1}, minmax(60px, auto)) minmax(0px, auto)`,
										}}
									>
										{Array.from(
											{
												length: 12 * gridRows,
											},
											(_, index) => {
												const x = index % 12
												const y = Math.floor(index / 12)
												const item = items.find(
													(item) =>
														item.position.x === x &&
														item.position.y === y
												)

												const isLastRow =
													y === gridRows - 1

												return (
													<GridCell
														key={index}
														id={index}
														isLastRow={isLastRow}
													>
														{item && (
															<GridItem
																id={item.id}
															>
																{item.id}
															</GridItem>
														)}
													</GridCell>
												)
											}
										)}
									</div>
								</SortableContext>
								<DragOverlay>
									{activeId ? (
										<Item id={activeId}>{activeId}</Item>
									) : null}
								</DragOverlay>
							</DndContext>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default TestPage
