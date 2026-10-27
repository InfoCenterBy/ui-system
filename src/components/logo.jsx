import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'

const Logo = () => {
	return (
		<>
			<div>
				<img src={viteLogo} className='logo' alt='Vite logo' />
			</div>
			<div>
				<img src={reactLogo} className='logo react' alt='React logo' />
			</div>
		</>
	)
}

export default Logo
