import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/system/layout/appLayout'
import Overview from './pages/overview'
import ComponentPage from './pages/componentPage'
import Colors from './pages/colors'
import Favorites from './pages/favorites'
import ThemeGenerator from './pages/themeGenerator'
import TestPage from './pages/testPage'

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route index element={<Overview />} />
				<Route path='components/:slug' element={<ComponentPage />} />
				<Route path='favorites' element={<Favorites />} />
				<Route path='colors' element={<Colors />} />
				<Route path='theme-generator' element={<ThemeGenerator />} />
				<Route path='test' element={<TestPage />} />
				<Route path='*' element={<Navigate to='/' replace />} />
			</Route>
		</Routes>
	)
}

export default App
