import leaflet from 'leaflet';
export interface _Layer {
	layer: leaflet.Layer
	name: string | number
	overlay: boolean
}

