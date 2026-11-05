// Turns a file name into a draft description, only when it reads like words
export function altFromFileName(fileName: string): string {
	const base = fileName.replace(/\.[^.]+$/, '')
	const words = base
		.replace(/\([^)]*\)/g, ' ')
		.split(/[\s_\-.]+/)
		.filter(Boolean)
	// Camera and screenshot names, hashes and numbered files say nothing
	const camera =
		/^(img|dsc|dscn|dscf|pxl|mvimg|photo|image|screenshot|scan|pic|picture|untitled|снимок|фото|изображение)$/i
	const meaningful = words.filter(
		(w) => !/\d/.test(w) && w.length > 1 && !camera.test(w)
	)
	if (meaningful.length === 0 || meaningful.length < words.length / 2) {
		return ''
	}
	// A long word without vowels is most likely a hash
	if (
		meaningful.some((w) => w.length > 12 && !/[aeiouyаеёиоуыэюя]/i.test(w))
	) {
		return ''
	}
	const text = meaningful.join(' ')
	return text.charAt(0).toUpperCase() + text.slice(1)
}
