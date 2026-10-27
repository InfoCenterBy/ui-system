import classNames from 'classnames'

const BtnDefault = ({ children, onClick, className }) => {
	return (
		<>
			<button onClick={onClick} className={classNames('btn', className)}>
				{children}
			</button>
		</>
	)
}
export default BtnDefault
