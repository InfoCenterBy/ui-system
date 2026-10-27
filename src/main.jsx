import { createRoot } from 'react-dom/client'
import './index.css'
// Registers the web components used by the calendar examples
import 'cally'
import App from './App.jsx'
import { HashRouter } from 'react-router-dom'
import { StrictMode } from 'react'
import { ThemeProvider } from './contexts/themeContext'

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<HashRouter basename='/'>
			<ThemeProvider>
				<App />
			</ThemeProvider>
		</HashRouter>
	</StrictMode>
)
