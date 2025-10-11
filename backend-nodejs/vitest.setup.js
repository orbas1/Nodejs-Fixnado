import { vi } from 'vitest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
process.env.DB_STORAGE = process.env.DB_STORAGE || ':memory:';
process.env.NODE_ENV = 'test';

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

  return { area, bbox, centroid, booleanValid };
});
