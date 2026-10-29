// Project assets are served from the root, anything else is an external URL
export const assetUrl = (src: string) =>
	src.startsWith('assets/') ? `/${src}` : src
