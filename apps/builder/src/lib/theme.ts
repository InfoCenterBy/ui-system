// Follow the system color scheme by toggling the dark class on <html>
export function watchSystemTheme(): void {
	const query = window.matchMedia('(prefers-color-scheme: dark)')
	const apply = () =>
		document.documentElement.classList.toggle('dark', query.matches)
	apply()
	query.addEventListener('change', apply)
}
