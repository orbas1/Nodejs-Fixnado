import { bboxPolygon, booleanPointInPolygon, centroid as turfCentroid } from '@turf/turf';

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

const DEFAULT_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const DEFAULT_USER_AGENT =
  process.env.OSM_USER_AGENT || 'FixnadoGeoOps/1.0 (+https://fixnado.io/ops)';

async function performFetch(url, { fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') {
    throw validationError('OpenStreetMap verification is not available in this environment');
  }

  try {
    const response = await fetchImpl(url, {
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
        Accept: 'application/json'
      }
    });
    return response;
  } catch (error) {
    const failure = new Error('OpenStreetMap verification request failed');
    failure.statusCode = 502;
    failure.cause = error;
    throw failure;
  }
}

export async function enforceOpenStreetMapCompliance(multiPolygon, options = {}) {
  if (!multiPolygon || !multiPolygon.type || !Array.isArray(multiPolygon.coordinates)) {
    throw validationError('A valid polygon geometry is required for OpenStreetMap verification');
  }

  const feature = {
    type: 'Feature',
    properties: {},
    geometry: multiPolygon
  };

  const centroid = turfCentroid(feature);
  const coordinates = centroid?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw validationError('Unable to compute centroid for zone polygon');
  }

  const [longitude, latitude] = coordinates;
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: latitude,
    lon: longitude,
    polygon_geojson: '0',
    addressdetails: '1'
  });
  const endpoint = options.endpoint || DEFAULT_ENDPOINT;
  const url = `${endpoint}?${params.toString()}`;

  const response = await performFetch(url, options);
  if (!response?.ok) {
    throw validationError('OpenStreetMap could not verify the provided location');
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    const failure = validationError('OpenStreetMap response was not valid JSON');
    failure.cause = error;
    throw failure;
  }

  if (!payload || payload.error) {
    throw validationError(payload?.error || 'OpenStreetMap could not locate the zone centroid');
  }

  const boundingBox = payload.boundingbox;
  if (!Array.isArray(boundingBox) || boundingBox.length !== 4) {
    throw validationError('OpenStreetMap response missing bounding box data');
  }

  const [southRaw, northRaw, westRaw, eastRaw] = boundingBox;
  const south = Number.parseFloat(southRaw);
  const north = Number.parseFloat(northRaw);
  const west = Number.parseFloat(westRaw);
  const east = Number.parseFloat(eastRaw);

  if (![south, north, west, east].every(Number.isFinite)) {
    throw validationError('OpenStreetMap bounding box data was malformed');
  }

  const osmPolygon = bboxPolygon([west, south, east, north]);
  const centroidInside = booleanPointInPolygon(centroid, osmPolygon);
  if (!centroidInside) {
    throw validationError('Zone centroid lies outside the OpenStreetMap verified boundary');
  }

  return {
    status: 'verified',
    checkedAt: new Date().toISOString(),
    displayName: payload.display_name ?? null,
    placeId: payload.place_id ?? null,
    licence: payload.licence ?? null,
    centroid: { latitude, longitude },
    boundingBox: { west, east, south, north }
  };
}

export function attachOpenStreetMapMetadata(sourceMetadata = {}, verification = null) {
  const base = typeof sourceMetadata === 'object' && sourceMetadata !== null ? { ...sourceMetadata } : {};
  if (!verification) {
    return base;
  }

  const compliance = {
    ...(base.compliance || {})
  };

  compliance.openStreetMap = verification;
  return {
    ...base,
    compliance
  };
}
