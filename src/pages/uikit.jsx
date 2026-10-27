import { useState } from 'react'
import Logo from '../components/logo'
import ComponentWrapper from '../components/system/componentWrapper'
import SideNav from '../components/system/sidenav'
import BtnDefault from '../components/ui/group/buttons/default/btnDefault'
import AccordionDefault from '../components/ui/group/accordion/default/accordion'
import AccordionJoined from '../components/ui/group/accordion/joined/accordion'
import ColorParent from '../components/system/colors/colorParent'
import { ToastContainer } from 'react-toastify'
import Alert from '../components/ui/group/alert/default/alert'
import Badge from '../components/ui/group/badge/default/badge'
import BadgeSizes from '../components/ui/group/badge/sizes/badgeSizes'
import Breadcrumbs from '../components/ui/group/breadcrumbs/default/breadcrumbs'
import BreadcrumbsWithIcons from '../components/ui/group/breadcrumbs/withIcons/breadcrumbsWithIcons'
import ResponsiveBtn from '../components/ui/group/buttons/responsive/responsive'
import SizesBtn from '../components/ui/group/buttons/sizes/sizes'
import BtnRounded from '../components/ui/group/buttons/rounded/btnRounded'
import BtnCross from '../components/ui/group/buttons/cross/btnCross'
import Dropdown from '../components/ui/group/dropdown/default/dropdown'
import Checkbox from '../components/ui/group/checkbox/default/checkbox'
import CheckboxColors from '../components/ui/group/checkbox/colors/checkboxColors'
import CheckboxSizes from '../components/ui/group/checkbox/sizes/checkboxSizes'
import Radio from '../components/ui/group/radio/default/radio'
import RadioSizes from '../components/ui/group/radio/sizes/radioSizes'
import RadioColors from '../components/ui/group/radio/colors/radioColors'
import Card from '../components/ui/group/card/default/card'
import CardSizes from '../components/ui/group/card/sizes/cardSizes'
import CardNoImg from '../components/ui/group/card/noImg/cardNoImg'
import CardLeftImg from '../components/ui/group/card/leftImg/cardLeftImg'
import Modal from '../components/ui/group/modal/default/modal'
import Pagination from '../components/ui/group/pagination/default/pagination'
import PaginationSizes from '../components/ui/group/pagination/sizes/paginationSizes'
import Skeleton from '../components/ui/group/skeleton/default/skeleton'
import LoadingSpinner from '../components/ui/group/loading/spinner/loadingSpinner'
import LoadingDots from '../components/ui/group/loading/dots/loadingDots'
import LoadingRings from '../components/ui/group/loading/rings/loadingRings'
import LoadingColors from '../components/ui/group/loading/colors/loadingColors'
import Input from '../components/ui/group/inputs/default/input'
import InputFloatLabel from '../components/ui/group/inputs/floatLabel/inputFloatLabel'
import InputSizes from '../components/ui/group/inputs/sizes/inputSizes'
import InputValidator from '../components/ui/group/inputs/validator/inputValidator'
import InputSearch from '../components/ui/group/inputs/search/inputSearch'
import InputTime from '../components/ui/group/inputs/time/inputTime'
import InputDate from '../components/ui/group/inputs/date/inputDate'
import InputWithLabel from '../components/ui/group/inputs/withLabel/inputWithLabel'
import IndicatorBadge from '../components/ui/group/indicator/badge/indicatorBadge'
import IndicatorStatus from '../components/ui/group/indicator/status/indicatorStatus'
import Tabs from '../components/ui/group/tabs/default/tabs'
import TabsWithIcons from '../components/ui/group/tabs/withIcons/tabsWithIcons'
import Collapse from '../components/ui/group/collapse/default/collapse'
import Drawer from '../components/ui/group/drawer/default/drawer'
import DrawerOpenFromRight from '../components/ui/group/drawer/openFromRight/drawerOpenFromRight'
import Tooltip from '../components/ui/group/tooltip/default/tooltip'
import TooltipWithContent from '../components/ui/group/tooltip/withContent/tooltipWithContent'
import Toggle from '../components/ui/group/toggle/default/toggle'
import ToggleColors from '../components/ui/group/toggle/colors/toggleColors'
import ToggleSizes from '../components/ui/group/toggle/sizes/toggleSizes'
import ToggleDisabled from '../components/ui/group/toggle/disabled/toggleDisabled'
import Label from '../components/ui/group/label/default/label'
import FloatingLabel from '../components/ui/group/label/floatingLabel/floatingLabel'
import FloatingLabelSizes from '../components/ui/group/label/floatingLabelSizes/floatingLabelSizes'
import Select from '../components/ui/group/select/default/select'
import SelectSizes from '../components/ui/group/select/sizes/selectSizes'
import SelectDisabled from '../components/ui/group/select/disabled/selectDisabled'
import Range from '../components/ui/group/range/default/range'
import RangeSizes from '../components/ui/group/range/sizes/rangeSizes'
import RangeSteps from '../components/ui/group/range/rangeSteps/rangeSteps'
import RangeDisabled from '../components/ui/group/range/disabled/rangeDisabled'

const UiKit = () => {
	// Several variants: category: [{ name: 'variant', component: <Jsx /> }]
	// Single variant: category: [{ component: <Jsx /> }]
	const uiList = {
		button: [
			{
				name: 'default',
				component: <BtnDefault>Click me</BtnDefault>,
			},
			{
				name: 'responsive',
				component: <ResponsiveBtn />,
			},
			{
				name: 'sizes',
				component: <SizesBtn />,
			},
			{
				name: 'rounded',
				component: <BtnRounded />,
			},
			{
				name: 'close',
				component: <BtnCross />,
			},
		],
		accordion: [
			{
				name: 'default',
				component: <AccordionDefault />,
			},
			{
				name: 'joined',
				component: <AccordionJoined />,
			},
		],
		alert: [
			{
				name: 'default',
				component: <Alert />,
			},
		],
		badge: [
			{
				name: 'default',
				component: <Badge />,
			},
			{
				name: 'sizes',
				component: <BadgeSizes />,
			},
		],
		breadcrumbs: [
			{
				name: 'default',
				component: <Breadcrumbs />,
			},
			{
				name: 'withIcons',
				component: <BreadcrumbsWithIcons />,
			},
		],
		dropdown: [
			{
				name: 'default',
				component: <Dropdown />,
			},
		],
		checkbox: [
			{
				name: 'default',
				component: <Checkbox />,
			},
			{
				name: 'colors',
				component: <CheckboxColors />,
			},
			{
				name: 'sizes',
				component: <CheckboxSizes />,
			},
		],
		radio: [
			{
				name: 'default',
				component: <Radio />,
			},
			{
				name: 'sizes',
				component: <RadioSizes />,
			},
			{
				name: 'colors',
				component: <RadioColors />,
			},
		],
		card: [
			{
				name: 'default',
				component: <Card />,
			},
			{
				name: 'sizes',
				component: <CardSizes />,
			},
			{
				name: 'noImg',
				component: <CardNoImg />,
			},
			{
				name: 'leftImg',
				component: <CardLeftImg />,
			},
		],
		modal: [
			{
				name: 'default',
				component: <Modal />,
			},
		],
		pagination: [
			{
				name: 'default',
				component: <Pagination />,
			},
			{
				name: 'sizes',
				component: <PaginationSizes />,
			},
		],
		skeleton: [
			{
				name: 'default',
				component: <Skeleton />,
			},
		],
		collapse: [
			{
				name: 'default',
				component: <Collapse />,
			},
		],
		tabs: [
			{
				name: 'default',
				component: <Tabs />,
			},
			{
				name: 'withIcons',
				component: <TabsWithIcons />,
			},
		],
		drawer: [
			{
				name: 'default',
				component: <Drawer />,
			},
			{
				name: 'openFromRight',
				component: <DrawerOpenFromRight />,
			},
		],
		tooltip: [
			{
				name: 'default',
				component: <Tooltip />,
			},
			{
				name: 'withContent',
				component: <TooltipWithContent />,
			},
		],
		toggle: [
			{
				name: 'default',
				component: <Toggle />,
			},
			{
				name: 'colors',
				component: <ToggleColors />,
			},
			{
				name: 'sizes',
				component: <ToggleSizes />,
			},
			{
				name: 'disabled',
				component: <ToggleDisabled />,
			},
		],
		loading: [
			{
				name: 'spinner',
				component: <LoadingSpinner />,
			},
			{
				name: 'dots',
				component: <LoadingDots />,
			},
			{
				name: 'rings',
				component: <LoadingRings />,
			},
			{
				name: 'colors',
				component: <LoadingColors />,
			},
		],
		label: [
			{
				name: 'default',
				component: <Label />,
			},
			{
				name: 'floatingLabel',
				component: <FloatingLabel />,
			},
			{
				name: 'floatingLabelSizes',
				component: <FloatingLabelSizes />,
			},
		],
		select: [
			{
				name: 'default',
				component: <Select />,
			},
			{
				name: 'sizes',
				component: <SelectSizes />,
			},
			{
				name: 'disabled',
				component: <SelectDisabled />,
			},
		],
		range: [
			{
				name: 'default',
				component: <Range />,
			},
			{
				name: 'sizes',
				component: <RangeSizes />,
			},
			{
				name: 'steps',
				component: <RangeSteps />,
			},
			{
				name: 'disabled',
				component: <RangeDisabled />,
			},
		],
		input: [
			{
				name: 'default',
				component: <Input />,
			},
			{
				name: 'floatLabel',
				component: <InputFloatLabel />,
			},

			{
				name: 'validator',
				component: <InputValidator />,
			},
			{
				name: 'search',
				component: <InputSearch />,
			},
			{
				name: 'time',
				component: <InputTime />,
			},
			{
				name: 'date',
				component: <InputDate />,
			},
			{
				name: 'withLabel',
				component: <InputWithLabel />,
			},
			{
				name: 'sizes',
				component: <InputSizes />,
			},
		],
		indicator: [
			{
				name: 'badge',
				component: <IndicatorBadge />,
			},
			{
				name: 'status',
				component: <IndicatorStatus />,
			},
		],
		// test: [
		// 	{
		// 		component: <Logo />,
		// 	},
		// ],
	}

	// Map uiList to { category: ['variant'] } for the side nav
	const navList = Object.entries(uiList).reduce((acc, [key, items]) => {
		if (Array.isArray(items)) {
			acc[key] = items
				.filter((item) => item?.name)
				.map((item) => item.name)
		} else {
			// Not an array, no variants
			acc[key] = []
		}
		return acc
	}, {})

	const [active, setActive] = useState({
		category: '',
		name: '',
		tab: 'preview',
	})

	return (
		<>
			<main>
				<div className='flex h-full w-full flex-row flex-wrap content-start items-start gap-x-6 pt-2 lg:flex-nowrap'>
					<SideNav
						className={'w-full lg:w-[20%]'}
						listItem={navList}
						changeSelectedComponent={(category, name) =>
							setActive({ category, name, tab: 'preview' })
						}
					/>
					<div className='w-full overflow-x-hidden pb-20 lg:w-[80%]'>
						<div className='w-full'>
							<ColorParent />
						</div>
						<div className='mt-4 flex flex-col gap-3'>
							{Object.entries(uiList).map(
								([category, components]) => (
									<ComponentWrapper
										key={category}
										category={category}
										components={components}
										selectedComponent={active}
										setSelectedComponent={setActive}
									/>
								)
							)}
						</div>
					</div>
				</div>
				<ToastContainer
					position='top-right'
					hideProgressBar
					closeOnClick
					draggable
					pauseOnHover
					toastClassName={() => 'toast toast-top toast-end'}
					bodyClassName={() => 'p-0'}
					limit={5}
					autoClose={5000}
					pauseOnFocusLoss={true}
				/>
			</main>
		</>
	)
}

export default UiKit
