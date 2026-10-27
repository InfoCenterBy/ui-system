const DAISY_COLORS = [
	'base-100',
	'base-200',
	'base-300',
	'base-content',
	...[
		'primary',
		'secondary',
		'accent',
		'neutral',
		'info',
		'success',
		'warning',
		'error',
	].flatMap((c) => [c, `${c}-content`]),
]

// daisyUI colors and radii as Tailwind theme keys, values stay with the active theme
export const DAISY_THEME_CSS = `@theme inline reference { ${[
	...DAISY_COLORS.map((c) => `--color-${c}: var(--color-${c});`),
	...['box', 'field', 'selector'].map(
		(r) => `--radius-${r}: var(--radius-${r});`
	),
].join(' ')} }`
