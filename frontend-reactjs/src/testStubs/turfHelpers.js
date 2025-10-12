export const feature = (geometry, properties = {}) => ({
  type: 'Feature',
  geometry,
  properties
});

export const featureCollection = (features = []) => ({
  type: 'FeatureCollection',
  features
});

export default {
  feature,
  featureCollection
};
