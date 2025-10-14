const { vi } = globalThis;

if (!vi) {
  throw new Error('Vitest globals are not initialised.');
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
process.env.DB_STORAGE = process.env.DB_STORAGE || ':memory:';
process.env.NODE_ENV = 'test';
process.env.AGORA_APP_ID = process.env.AGORA_APP_ID || 'test-app-id';
process.env.AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || 'test-app-cert';

vi.mock('@aws-sdk/client-secrets-manager', () => {
  class SecretsManagerClient {
    constructor() {
      this.commands = [];
    }

    async send(command) {
      this.commands.push(command);
      if (command instanceof GetSecretValueCommand) {
        return { SecretString: JSON.stringify({}), VersionId: 'mock-version' };
      }
      return { VersionId: 'mock-version' };
    }
  }

  class GetSecretValueCommand {
    constructor(input) {
      this.input = input;
    }
  }

  class PutSecretValueCommand {
    constructor(input) {
      this.input = input;
    }
  }

  return { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand };
});

vi.mock('@turf/turf', () => {
  function extractRings(feature) {
    const geometry = feature.geometry || feature;
    if (!geometry) {
      return [];
    }
    if (geometry.type === 'Polygon') {
      return geometry.coordinates || [];
    }
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates?.flat() || [];
    }
    return [];
  }

  function booleanValid(feature) {
    const rings = extractRings(feature);
    return rings.every((ring) => {
      if (!Array.isArray(ring) || ring.length < 4) {
        return false;
      }
      const [firstLon, firstLat] = ring[0];
      const [lastLon, lastLat] = ring[ring.length - 1];
      return firstLon === lastLon && firstLat === lastLat;
    });
  }

  function area(feature) {
    if (!booleanValid(feature)) {
      return 0;
    }
    const rings = extractRings(feature);
    const ring = rings[0] || [];
    if (ring.length < 4) {
      return 0;
    }
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      sum += x1 * y2 - x2 * y1;
    }
    return Math.abs(sum) * 1e6; // convert degrees to approx square metres
  }

  function bbox(feature) {
    const rings = extractRings(feature);
    const coords = rings.flat();
    const lons = coords.map(([lon]) => lon);
    const lats = coords.map(([, lat]) => lat);
    return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  }

  function centroid(feature) {
    const rings = extractRings(feature);
    const coords = rings.flat();
    const lon = coords.reduce((acc, [value]) => acc + value, 0) / coords.length;
    const lat = coords.reduce((acc, [, value]) => acc + value, 0) / coords.length;
    return { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] } };
  }

  function point(coordinates) {
    return { type: 'Feature', geometry: { type: 'Point', coordinates } };
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function distance(a, b, options = {}) {
    const [lon1, lat1] = (a.geometry || a).coordinates;
    const [lon2, lat2] = (b.geometry || b).coordinates;
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);

    const haversine =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
    const distanceKm = earthRadiusKm * c;

    if (options.units === 'kilometers' || !options.units) {
      return distanceKm;
    }
    if (options.units === 'miles') {
      return distanceKm * 0.621371;
    }
    return distanceKm;
  }

  function booleanPointInPolygon(pointFeature, polygonFeature) {
    const [x, y] = (pointFeature.geometry || pointFeature).coordinates;
    const rings = extractRings(polygonFeature);
    const polygon = rings[0] || [];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }

  function bboxPolygon(extent) {
    const [minX, minY, maxX, maxY] = extent;
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [minX, minY],
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY],
            [minX, minY]
          ]
        ]
      }
    };
  }

  return { area, bbox, centroid, booleanValid, point, distance, booleanPointInPolygon, bboxPolygon };
});
