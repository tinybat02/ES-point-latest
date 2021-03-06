import React, { PureComponent } from 'react';
import { PanelProps, Vector as VectorData } from '@grafana/data';
// import VectorSource from 'ol/source/Vector';
import { MapOptions } from '../types';
import { Map, View } from 'ol';
import XYZ from 'ol/source/XYZ';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { fromLonLat } from 'ol/proj';
import { defaults, DragPan, MouseWheelZoom } from 'ol/interaction';
import { platformModifierKeyOnly } from 'ol/events/condition';
import nanoid from 'nanoid';
import { processDataES } from './utils/helpers';
import 'ol/ol.css';
import '../style/MainPanel.css';

interface Props extends PanelProps<MapOptions> {}
interface Buffer extends VectorData {
  buffer: any;
}

export class MainPanel extends PureComponent<Props> {
  id = 'id' + nanoid();
  map: Map;
  randomTile: TileLayer;
  pointLayer: VectorLayer;

  componentDidMount() {
    const { tile_url, zoom_level, center_lon, center_lat } = this.props.options;

    const carto = new TileLayer({
      source: new XYZ({
        url: 'https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      }),
    });
    this.map = new Map({
      interactions: defaults({ dragPan: false, mouseWheelZoom: false }).extend([
        new DragPan({
          condition: function(event) {
            return this.getPointerCount() === 2 || platformModifierKeyOnly(event);
          },
        }),
        new MouseWheelZoom({
          condition: platformModifierKeyOnly,
        }),
      ]),
      layers: [carto],
      view: new View({
        center: fromLonLat([center_lon, center_lat]),
        zoom: zoom_level,
      }),
      target: this.id,
    });

    if (tile_url !== '') {
      this.randomTile = new TileLayer({
        source: new XYZ({
          url: tile_url,
        }),
        zIndex: 1,
      });
      this.map.addLayer(this.randomTile);
    }

    if (this.props.data.series.length > 0) {
      const { buffer } = this.props.data.series[0].fields[0].values as Buffer;
      this.pointLayer = processDataES(buffer);
      this.map.addLayer(this.pointLayer);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.data.series[0] !== this.props.data.series[0]) {
      // remove existing layers
      this.map.removeLayer(this.pointLayer);
      if (this.props.data.series.length > 0) {
        const { buffer } = this.props.data.series[0].fields[0].values as Buffer;
        this.pointLayer = processDataES(buffer);
        this.map.addLayer(this.pointLayer);
      }
    }

    if (prevProps.options.tile_url !== this.props.options.tile_url) {
      if (this.randomTile) {
        this.map.removeLayer(this.randomTile);
      }
      if (this.props.options.tile_url !== '') {
        this.randomTile = new TileLayer({
          source: new XYZ({
            url: this.props.options.tile_url,
          }),
          zIndex: 1,
        });
        this.map.addLayer(this.randomTile);
      }
    }

    if (prevProps.options.zoom_level !== this.props.options.zoom_level) {
      this.map.getView().setZoom(this.props.options.zoom_level);
    }

    if (
      prevProps.options.center_lat !== this.props.options.center_lat ||
      prevProps.options.center_lon !== this.props.options.center_lon
    ) {
      this.map.getView().animate({
        center: fromLonLat([this.props.options.center_lon, this.props.options.center_lat]),
        duration: 2000,
      });
    }
  }

  render() {
    return <div id={this.id} style={{ width: '100%', height: '100%' }}></div>;
  }
}
