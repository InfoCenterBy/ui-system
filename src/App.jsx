import { Routes, Route } from 'react-router-dom'
import UiKit from './pages/uikit'
import Home from './pages/home'
import TestPage from './pages/testPage'
import NavBar from './components/system/navbar'

function App() {
	return (
		<>
			<div className='relative min-h-screen px-1'>
				<NavBar className='sticky top-0 z-10' />
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/ui' element={<UiKit />} />
					<Route path='/test' element={<TestPage />} />
				</Routes>
			</div>
		</>
	)
}

export default App
