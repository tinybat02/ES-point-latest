import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Circle, Style, Fill, Text, Stroke } from 'ol/style';

interface SingleData {
  // coordinate: [number, number];
  latitude: number;
  longitude: number;
  mac_address: string;
  [key: string]: any;
}

export const processDataES = (data: SingleData[]) => {
  // latest record per each mac_address
  // const latestRecords = data.reduce((rv: { [key: string]: [number, number] }, item) => {
  //   if (!rv[item['hash_id']]) {
  //     rv[item['hash_id']] = [item.longitude, item.latitude];
  //   }
  //   return rv;
  // }, {});

  // const arrayCoordinations = Object.values(latestRecords);
  //   const dataPoints = arrayCoordinations.map(item => {
  //   return new Feature({
  //     geometry: new Point(fromLonLat(item)),
  //   });
  // });

  const latestCoord: { [key: string]: [number, number] } = {};
  const latestUncertainty: { [key: string]: number } = {};
  const latestVendor: { [key: string]: string } = {};
  data.map(item => {
    if (!latestCoord[item.hash_id]) {
      latestCoord[item.hash_id] = [item.longitude, item.latitude];
      latestUncertainty[item.hash_id] = item.uncertainty;
      latestVendor[item.hash_id] = item.vendor;
    }
  });

  const dataPoints = Object.keys(latestCoord).map(hash => {
    const pointFeature = new Feature(new Point(latestCoord[hash]).transform('EPSG:4326', 'EPSG:3857'));
    pointFeature.setStyle(
      new Style({
        image: new Circle({
          radius: latestUncertainty[hash],
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
          stroke: new Stroke({
            color: '#49A8DE',
            width: 1,
          }),
        }),
        text: new Text({
          stroke: new Stroke({
            color: '#b7b7b7',
            width: 1,
          }),
          font: '18px',
          text: latestVendor[hash],
          offsetY: -10,
        }),
      })
    );
    return pointFeature;
  });

  return new VectorLayer({
    source: new VectorSource({
      features: dataPoints,
    }),
    zIndex: 2,
  });
};
