import leaflet from 'leaflet';
import {
	_Layer
} from './utils'

namespace L.Control {
	export interface OpacityConstructorOptions extends leaflet.ControlOptions {
		collapsed: boolean
		label: string | null
	}
	export class Opacity extends leaflet.Control {
		options: OpacityConstructorOptions;
		_layerControlInputs: HTMLInputElement[] = [];
		_layers: _Layer[] = [];
		//_lastZIndex: number;
		_container: HTMLDivElement;
		_form: HTMLFormElement;
		_baseLayersList: HTMLDivElement;
		_separator: HTMLDivElement;
		_overlaysList: HTMLDivElement;
		className: string = "leaflet-control-layers";
		constructor(options?: OpacityConstructorOptions) {
			super(options);
			this.options = options || {
				collapsed: false,
				position: 'topright',
				label: "null"
			};
			this._container = leaflet.DomUtil.create("div", "custom-panel leaflet-bar " + this.className);
			this._form = leaflet.DomUtil.create('form', this.className + '-list');
			this._baseLayersList = leaflet.DomUtil.create('div', this.className + '-base');
			this._separator = leaflet.DomUtil.create('div', this.className + '-separator');
			this._overlaysList = leaflet.DomUtil.create('div', this.className + '-overlays');
		}
		initialize = (overlays: leaflet.Layer[]) => {
			leaflet.Util.setOptions(this, this.options);
			this._layerControlInputs = [];
			this._layers = [];
			//this._lastZIndex = 0;
			overlays.forEach((overlay, index) => {
				this._addLayer(overlay, index, true);
			})
		}
		onAdd = (map: leaflet.Map): HTMLDivElement => {
			// コントロールを折りたたむ
			const collapseControl = () => {
				leaflet.DomUtil.removeClass(this._container, 'leaflet-control-layers-expanded');
			}
			// 折り畳まれたコントロールを展開する
			const expandControl = () => {
				leaflet.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
				this._form.style.height = "";
				const acceptableHeight = map.getSize().y - (this._container.offsetTop + 50);
				if (acceptableHeight < this._form.clientHeight) {
					leaflet.DomUtil.addClass(this._form, 'leaflet-control-layers-scrollbar');
					this._form.style.height = acceptableHeight + 'px';
				} else {
					leaflet.DomUtil.removeClass(this._form, 'leaflet-control-layers-scrollbar');
				}
			}
			// コントロールの作成
			this._container.setAttribute('aria-haspopup', "true");
			leaflet.DomEvent.disableClickPropagation(this._container);
			leaflet.DomEvent.disableScrollPropagation(this._container);
			// ラベルが指定されている場合はp要素を用いて表示
			if (this.options.label !== null) {
				const labelElem = leaflet.DomUtil.create('p', this.className + '-label');
				labelElem.innerHTML = this.options.label;
				this._container.appendChild(labelElem);
			}
			// 操作パネルを作成
			// collapsedが指定されている場合の処理
			if (this.options.collapsed === true) {
				map.on({
					click: collapseControl,
					zoom: collapseControl,
					move: collapseControl
				});
				if (!leaflet.Browser.android) {
					leaflet.DomEvent.on(this._container, {
						mouseenter: expandControl,
						mouseleave: collapseControl
					})
				}
			}
			const link = leaflet.DomUtil.create('a', this.className + '-toggle', this._container);
			link.href = '#',
				link.title = 'Layers';
			if (leaflet.Browser.touch) {
				leaflet.DomEvent.on(link, 'click', leaflet.DomEvent.stop);
				leaflet.DomEvent.on(link, 'click', expandControl, this);
			} else {
				leaflet.DomEvent.on(link, 'focus', expandControl, this);
			}
			if (this.options.collapsed === false) {
				expandControl();
			}
			this._baseLayersList.appendChild(this._form);
			this._separator.appendChild(this._form);
			this._overlaysList.appendChild(this._form);
			this._container.appendChild(this._form);
			return this._container;
		}


		_addLayer = (layer: leaflet.Layer, name: string | number, overlay: boolean) => {
			this._layers.push({
				layer: layer,
				name: name,
				overlay: overlay
			});
		}
		_update = () => {
			// 一旦初期化する
			leaflet.DomUtil.empty(this._baseLayersList);
			leaflet.DomUtil.empty(this._overlaysList);

			//let isOverlay = false;
			this._layerControlInputs = [];
			this._layers.forEach(_layer => {
				this._addItem(_layer);
				// options.hideSingleBaseに対応する処理はあとでかく
			});
		}
		_addItem = (layer: _Layer) => {
			const label = document.createElement('label');
			let input = document.createElement('input');
			if (layer.overlay) {
				// スライドバーを追加
				input.type = 'range';
				input.className = 'leaflet-control-layers-range';
				input.min = '0';
				input.max = '100';
				// 透明度を取得しスライドバーに反映
				const theLayer = layer.layer.getPane();
				if (theLayer !== undefined) {
					const transparency = parseInt(theLayer.style.opacity) * 100;
					input.value = transparency.toString();
				}
			}
			this._layerControlInputs.push(input);
			input.setAttribute("layerId", leaflet.Util.stamp(layer.layer).toString());
			// スライドバーイベント
			input.addEventListener('input', (event) => {
				if (event.target instanceof HTMLInputElement) {
					const rgValue = event.target?.value;
					const layerId = input.getAttribute("layerId");
					if (layerId !== null) {
						const layer = this._getLayer(parseInt(layerId)).layer;
						// 透過度設定
						const transparency = parseInt(rgValue) / 100;
						const theLayer = layer.getPane()
						if (theLayer !== undefined) {
							theLayer.style.opacity = transparency.toString();
						}
					}
				}
			});
			const name = document.createElement('span');
			name.innerHTML = ' ' + layer.name;
			const holder = document.createElement('div');
			const holder2 = document.createElement('div');
			label.appendChild(holder);
			holder.appendChild(name);
			label.appendChild(holder2);
			holder2.appendChild(input);
			const container = layer.overlay ? this._overlaysList : this._baseLayersList;
			container.appendChild(label);
		}
		_getLayer = (id: number): _Layer => {
			return this._layers.filter(_layer => {
				return leaflet.Util.stamp(_layer.layer) === id
			})[0];
		}
	}
}