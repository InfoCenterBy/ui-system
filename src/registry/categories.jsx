import BtnDefault from '../components/ui/group/buttons/default/btnDefault'
import AccordionDefault from '../components/ui/group/accordion/default/accordion'
import AccordionJoined from '../components/ui/group/accordion/joined/accordion'
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

export const categories = [
	{
		slug: 'button',
		name: 'Button',
		group: 'actions',
		description:
			'Кнопки для действий пользователя с разными цветами, размерами и формами',
		variants: [
			{ name: 'default', component: <BtnDefault>Click me</BtnDefault> },
			{ name: 'responsive', component: <ResponsiveBtn /> },
			{ name: 'sizes', component: <SizesBtn /> },
			{ name: 'rounded', component: <BtnRounded /> },
			{ name: 'close', component: <BtnCross /> },
		],
	},
	{
		slug: 'accordion',
		name: 'Accordion',
		group: 'data-display',
		description: 'Список секций, где одновременно раскрыта только одна',
		variants: [
			{ name: 'default', component: <AccordionDefault /> },
			{ name: 'joined', component: <AccordionJoined /> },
		],
	},
	{
		slug: 'alert',
		name: 'Alert',
		group: 'feedback',
		description: 'Сообщение пользователю о важном событии',
		variants: [{ name: 'default', component: <Alert /> }],
	},
	{
		slug: 'badge',
		name: 'Badge',
		group: 'data-display',
		description: 'Небольшая метка для статуса или счётчика',
		variants: [
			{ name: 'default', component: <Badge /> },
			{ name: 'sizes', component: <BadgeSizes /> },
		],
	},
	{
		slug: 'breadcrumbs',
		name: 'Breadcrumbs',
		group: 'navigation',
		description:
			'Цепочка ссылок, показывающая положение страницы в структуре сайта',
		variants: [
			{ name: 'default', component: <Breadcrumbs /> },
			{ name: 'withIcons', component: <BreadcrumbsWithIcons /> },
		],
	},
	{
		slug: 'dropdown',
		name: 'Dropdown',
		group: 'actions',
		description: 'Выпадающее меню, которое открывается по клику на кнопку',
		variants: [{ name: 'default', component: <Dropdown /> }],
	},
	{
		slug: 'checkbox',
		name: 'Checkbox',
		group: 'data-input',
		description: 'Флажок для выбора одного или нескольких вариантов',
		variants: [
			{ name: 'default', component: <Checkbox /> },
			{ name: 'colors', component: <CheckboxColors /> },
			{ name: 'sizes', component: <CheckboxSizes /> },
		],
	},
	{
		slug: 'radio',
		name: 'Radio',
		group: 'data-input',
		description: 'Переключатель для выбора одного варианта из списка',
		variants: [
			{ name: 'default', component: <Radio /> },
			{ name: 'sizes', component: <RadioSizes /> },
			{ name: 'colors', component: <RadioColors /> },
		],
	},
	{
		slug: 'card',
		name: 'Card',
		group: 'data-display',
		description:
			'Карточка для группировки контента: изображение, заголовок, текст и действия',
		variants: [
			{ name: 'default', component: <Card /> },
			{ name: 'sizes', component: <CardSizes /> },
			{ name: 'noImg', component: <CardNoImg /> },
			{ name: 'leftImg', component: <CardLeftImg /> },
		],
	},
	{
		slug: 'modal',
		name: 'Modal',
		group: 'actions',
		description: 'Диалоговое окно поверх страницы для сообщений и действий',
		variants: [{ name: 'default', component: <Modal /> }],
	},
	{
		slug: 'pagination',
		name: 'Pagination',
		group: 'navigation',
		description: 'Группа кнопок для перехода между страницами',
		variants: [
			{ name: 'default', component: <Pagination /> },
			{ name: 'sizes', component: <PaginationSizes /> },
		],
	},
	{
		slug: 'skeleton',
		name: 'Skeleton',
		group: 'feedback',
		description: 'Заглушка, повторяющая форму контента во время загрузки',
		variants: [{ name: 'default', component: <Skeleton /> }],
	},
	{
		slug: 'collapse',
		name: 'Collapse',
		group: 'data-display',
		description: 'Блок, который показывает и скрывает содержимое',
		variants: [{ name: 'default', component: <Collapse /> }],
	},
	{
		slug: 'tabs',
		name: 'Tabs',
		group: 'navigation',
		description: 'Вкладки для переключения между представлениями',
		variants: [
			{ name: 'default', component: <Tabs /> },
			{ name: 'withIcons', component: <TabsWithIcons /> },
		],
	},
	{
		slug: 'drawer',
		name: 'Drawer',
		group: 'layout',
		description: 'Боковая панель, которая выезжает поверх контента',
		variants: [
			{ name: 'default', component: <Drawer /> },
			{ name: 'openFromRight', component: <DrawerOpenFromRight /> },
		],
	},
	{
		slug: 'tooltip',
		name: 'Tooltip',
		group: 'feedback',
		description: 'Подсказка, которая появляется при наведении',
		variants: [
			{ name: 'default', component: <Tooltip /> },
			{ name: 'withContent', component: <TooltipWithContent /> },
		],
	},
	{
		slug: 'toggle',
		name: 'Toggle',
		group: 'data-input',
		description: 'Переключатель в виде тумблера для включения и выключения',
		variants: [
			{ name: 'default', component: <Toggle /> },
			{ name: 'colors', component: <ToggleColors /> },
			{ name: 'sizes', component: <ToggleSizes /> },
			{ name: 'disabled', component: <ToggleDisabled /> },
		],
	},
	{
		slug: 'loading',
		name: 'Loading',
		group: 'feedback',
		description: 'Анимированный индикатор загрузки',
		variants: [
			{ name: 'spinner', component: <LoadingSpinner /> },
			{ name: 'dots', component: <LoadingDots /> },
			{ name: 'rings', component: <LoadingRings /> },
			{ name: 'colors', component: <LoadingColors /> },
		],
	},
	{
		slug: 'label',
		name: 'Label',
		group: 'data-input',
		description: 'Подпись для поля ввода, в том числе плавающая',
		variants: [
			{ name: 'default', component: <Label /> },
			{ name: 'floatingLabel', component: <FloatingLabel /> },
			{ name: 'floatingLabelSizes', component: <FloatingLabelSizes /> },
		],
	},
	{
		slug: 'select',
		name: 'Select',
		group: 'data-input',
		description: 'Выбор одного значения из выпадающего списка',
		variants: [
			{ name: 'default', component: <Select /> },
			{ name: 'sizes', component: <SelectSizes /> },
			{ name: 'disabled', component: <SelectDisabled /> },
		],
	},
	{
		slug: 'range',
		name: 'Range',
		group: 'data-input',
		description: 'Ползунок для выбора значения из диапазона',
		variants: [
			{ name: 'default', component: <Range /> },
			{ name: 'sizes', component: <RangeSizes /> },
			{ name: 'steps', component: <RangeSteps /> },
			{ name: 'disabled', component: <RangeDisabled /> },
		],
	},
	{
		slug: 'input',
		name: 'Input',
		group: 'data-input',
		description: 'Текстовое поле ввода и его разновидности',
		variants: [
			{ name: 'default', component: <Input /> },
			{ name: 'floatLabel', component: <InputFloatLabel /> },
			{ name: 'validator', component: <InputValidator /> },
			{ name: 'search', component: <InputSearch /> },
			{ name: 'time', component: <InputTime /> },
			{ name: 'date', component: <InputDate /> },
			{ name: 'withLabel', component: <InputWithLabel /> },
			{ name: 'sizes', component: <InputSizes /> },
		],
	},
	{
		slug: 'indicator',
		name: 'Indicator',
		group: 'layout',
		description: 'Значок или статус, прикреплённый к углу другого элемента',
		variants: [
			{ name: 'badge', component: <IndicatorBadge /> },
			{ name: 'status', component: <IndicatorStatus /> },
		],
	},
]
