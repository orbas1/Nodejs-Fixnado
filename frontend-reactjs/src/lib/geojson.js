function cloneGeometry(geometry) {
  if (!geometry) {
    return null;
  }
  if (typeof structuredClone === 'function') {
    return structuredClone(geometry);
  }
  return JSON.parse(JSON.stringify(geometry));
}

export function normaliseGeometry(input) {
  if (!input) {
    return null;
  }
  if (input.type === 'Feature') {
    return input.geometry ? normaliseGeometry(input.geometry) : null;
  }
  if (input.type === 'FeatureCollection') {
    return null;
  }
  if (input.type && input.coordinates) {
    return cloneGeometry({ type: input.type, coordinates: input.coordinates });
  }
  return null;
}

export function createFeature(geometry, properties = {}, options = {}) {
  const normalised = normaliseGeometry(geometry);
  if (!normalised) {
    return null;
  }
  const feature = {
    type: 'Feature',
    properties: { ...properties },
    geometry: normalised
  };
  if (options.id) {
    feature.id = options.id;
  }
  return feature;
}

export function createFeatureCollection(features) {
  return {
    type: 'FeatureCollection',
    features: (features || []).filter(Boolean)
  };
}

function collectPositionsFromGeometry(geometry) {
  const positions = [];
  if (!geometry) {
    return positions;
  }
  const traverse = (coords) => {
    if (!Array.isArray(coords)) {
      return;
    }
    if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        positions.push([lng, lat]);
      }
      return;
    }
    coords.forEach(traverse);
  };

  traverse(geometry.coordinates);
  return positions;
}

export function computeBoundingBox(inputs) {
  const entries = Array.isArray(inputs) ? inputs : [inputs];
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let hasPosition = false;

  entries.forEach((entry) => {
    const geometry = normaliseGeometry(entry) ?? entry?.geometry;
    if (!geometry) {
      return;
    }
    collectPositionsFromGeometry(geometry).forEach(([lng, lat]) => {
      hasPosition = true;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    });
  });

  if (!hasPosition) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}

function round(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function geometriesAreEqual(a, b, { precision = 6 } = {}) {
  const geomA = normaliseGeometry(a);
  const geomB = normaliseGeometry(b);
  if (!geomA && !geomB) {
    return true;
  }
  if (!geomA || !geomB || geomA.type !== geomB.type) {
    return false;
  }
  const positionsA = collectPositionsFromGeometry(geomA);
  const positionsB = collectPositionsFromGeometry(geomB);
  if (positionsA.length !== positionsB.length) {
    return false;
  }
  for (let index = 0; index < positionsA.length; index += 1) {
    const [lngA, latA] = positionsA[index];
    const [lngB, latB] = positionsB[index];
    if (round(lngA, precision) !== round(lngB, precision) || round(latA, precision) !== round(latB, precision)) {
      return false;
    }
  }
  return true;
}

export function ensurePolygonWinding(geometry) {
  const geom = normaliseGeometry(geometry);
  if (!geom) {
    return null;
  }
  if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') {
    return geom;
  }
  const ensureRing = (ring) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      return ring;
    }
    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) {
      return [...ring, [firstLng, firstLat]];
    }
    return ring;
  };
  const updatePolygon = (polygon) => polygon.map((ring) => ensureRing(ring));

  if (geom.type === 'Polygon') {
    return { ...geom, coordinates: updatePolygon(geom.coordinates) };
  }
  return {
    ...geom,
    coordinates: geom.coordinates.map((polygon) => updatePolygon(polygon))
  };
}
