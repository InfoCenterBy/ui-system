import classNames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Controls from '../components/system/themeGenerator/controls'
import ExportDialog from '../components/system/themeGenerator/exportDialog'
import ImportDialog from '../components/system/themeGenerator/importDialog'
import ThemePreview from '../components/system/themeGenerator/themePreview'
import Icon from '../components/system/icon'
import { useTheme } from '../contexts/themeContext'
import { createTheme, decodeTheme, encodeTheme, themeStyle } from '../lib/theme'
import { toast } from '../lib/toast'

const STORAGE_KEY = 'theme-generator'

const loadSaved = () => {
	try {
		return decodeTheme(localStorage.getItem(STORAGE_KEY))
	} catch {
		return null
	}
}

const ThemeGenerator = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const [theme, setTheme] = useState(
		() => decodeTheme(searchParams.get('t')) ?? loadSaved() ?? createTheme()
	)
	const exportRef = useRef(null)
	const importRef = useRef(null)
	const [mode, setMode] = useState('dashboard')
	const { applyCustomTheme } = useTheme()
	const style = useMemo(() => themeStyle(theme.vars), [theme.vars])

	// Keep the URL shareable and the last theme saved, without spamming history
	useEffect(() => {
		const timer = setTimeout(() => {
			const encoded = encodeTheme(theme)
			try {
				localStorage.setItem(STORAGE_KEY, encoded)
			} catch {
				// Storage can be blocked, the URL still keeps the theme
			}
			if (searchParams.get('t') !== encoded) {
				setSearchParams({ t: encoded }, { replace: true })
			}
		}, 300)
		return () => clearTimeout(timer)
	}, [theme, searchParams, setSearchParams])

	const applyToSite = () => {
		applyCustomTheme(theme.vars)
		toast.success('Theme applied to the site')
	}

	return (
		<div className='mx-auto max-w-[100rem]'>
			<div className='flex flex-wrap items-end gap-4'>
				<div>
					<h1 className='text-3xl font-bold'>Theme generator</h1>
					<p className='mt-2 text-base-content/70'>
						Build a daisyUI theme and export it as CSS
					</p>
				</div>
				<div className='ms-auto flex flex-wrap gap-2'>
					<button
						className='btn btn-ghost'
						onClick={() =>
							setTheme(createTheme(theme.preset, theme.name))
						}
					>
						<Icon name='reset' className='size-4' />
						Reset
					</button>
					<button
						className='btn btn-ghost'
						onClick={() => importRef.current?.showModal()}
					>
						<Icon name='upload' className='size-4' />
						Import
					</button>
					<button className='btn' onClick={applyToSite}>
						Apply to site
					</button>
					<button
						className='btn btn-primary'
						onClick={() => exportRef.current?.showModal()}
					>
						<Icon name='code' className='size-4' />
						Export
					</button>
				</div>
			</div>
			<div className='mt-6 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]'>
				<aside className='rounded-box border border-base-300 p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto'>
					<Controls
						theme={theme}
						onChange={setTheme}
						onPreset={(preset) =>
							setTheme(createTheme(preset, theme.name))
						}
					/>
				</aside>
				<div className='flex min-w-0 flex-col gap-3'>
					<div
						role='tablist'
						className='tabs tabs-box self-start tabs-sm'
					>
						{[
							['dashboard', 'Dashboard'],
							['components', 'All components'],
						].map(([value, label]) => (
							<button
								key={value}
								role='tab'
								aria-selected={mode === value}
								className={classNames('tab', {
									'tab-active': mode === value,
								})}
								onClick={() => setMode(value)}
							>
								{label}
							</button>
						))}
					</div>
					<ThemePreview style={style} mode={mode} />
				</div>
			</div>
			<ExportDialog ref={exportRef} theme={theme} />
			<ImportDialog ref={importRef} onImport={setTheme} />
		</div>
	)
}

export default ThemeGenerator
