import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import { Vector as VectorLayer } from 'ol/layer';
import { Circle, Style, Fill, Text, Stroke } from 'ol/style';

const matchVendorUser = {
  '42:ae:29': 'Wasiq',
  '0e:86:70': 'Adeeb',
  '26:29:89': 'Nikos',
  'f8:f1:e6': 'Nam',
  'ba:29:16': 'George',
  '9a:f9:46': 'Mustafa',
};

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
  const latestVendorname: { [key: string]: string } = {};
  data.map(item => {
    if (!latestCoord[item.hash_id]) {
      latestCoord[item.hash_id] = [item.longitude, item.latitude];
      latestUncertainty[item.hash_id] = item.uncertainty;
      latestVendor[item.hash_id] = item.vendor;
      latestVendorname[item.hash_id] = item.vendorname;
    }
  });

  const dataPoints = Object.keys(latestCoord).map(hash => {
    const pointFeature = new Feature(new Point(latestCoord[hash]).transform('EPSG:4326', 'EPSG:3857'));
    let radius = 0;
    if (latestUncertainty[hash] <= 10) {
      radius = 20;
    } else if (latestUncertainty[hash] > 10 && latestUncertainty[hash] <= 30) {
      radius = 40;
    } else {
      radius = 80;
    }
    pointFeature.setStyle(
      new Style({
        image: new Circle({
          radius: radius,
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
          //@ts-ignore
          text: matchVendorUser[latestVendor[hash]] || latestVendorname[hash],
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
