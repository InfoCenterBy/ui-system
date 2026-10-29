// Shared drag payloads for the catalog, the canvas and the layers list
export interface PresetDrag {
	kind: 'preset'
	presetId: string
}

export interface LayerDrag {
	kind: 'layer'
	id: string
}

export const presetDrag = (presetId: string): PresetDrag => ({
	kind: 'preset',
	presetId,
})

export const layerDrag = (id: string): LayerDrag => ({ kind: 'layer', id })

type Data = Record<string | symbol, unknown>

export const asPreset = (data: Data): PresetDrag | null =>
	data.kind === 'preset' && typeof data.presetId === 'string'
		? { kind: 'preset', presetId: data.presetId }
		: null

export const asLayer = (data: Data): LayerDrag | null =>
	data.kind === 'layer' && typeof data.id === 'string'
		? { kind: 'layer', id: data.id }
		: null
