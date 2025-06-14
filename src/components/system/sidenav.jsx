const SideNav = ({ className, listItem }) => {
	const isObject = typeof { listItem } === 'object'
	const LinkStyle = ' dark:hover:bg-gray-800 hover:bg-gray-200'
	return (
		<>
			<ul
				className={
					className +
					' lg:top-2 top-0 sticky dark:bg-base-200 bg-transparent text-black dark:text-white rounded-box menu z-10 border dark:border-transparent border-gray-400 p-0 overflow-hidden'
				}
			>
				{isObject && listItem
					? Object.entries(listItem).map(([name, value]) => {
							// if element have a single option
							if (value[0] === undefined) {
								try {
									return (
										<li key={name}>
											<a
												className={`${LinkStyle} dark:hover:text-gray-400`}
											>
												{name}
											</a>
										</li>
									)
								} catch (error) {
									console.log(error)
								}
							}
							// basic render of element list
							try {
								const valueArr = value.map((el) => {
									return (
										<li key={el}>
											<a
												className={`${LinkStyle} dark:hover:text-gray-400`}
											>
												{el}
											</a>
										</li>
									)
								})

								return (
									<li key={name}>
										<details>
											<summary
												className={`${LinkStyle} dark:text-gray-500`}
											>
												{name}
											</summary>
											<ul className='before:bg-gray-700 dark:before:bg-amber-50'>
												{valueArr}
											</ul>
										</details>
									</li>
								)
							} catch (error) {
								console.log(error)
							}
						})
					: null}
			</ul>
		</>
	)
}

export default SideNav
