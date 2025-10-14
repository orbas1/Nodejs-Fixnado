import { afterEach, describe, expect, it, vi } from 'vitest';
import { enforceOpenStreetMapCompliance, attachOpenStreetMapMetadata } from '../src/services/openStreetMapService.js';

function buildMultiPolygon() {
  return {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [-0.15, 51.5],
          [-0.1, 51.5],
          [-0.1, 51.52],
          [-0.15, 51.52],
          [-0.15, 51.5]
        ]
      ]
    ]
  };
}

describe('openStreetMapService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches open street map metadata to existing metadata', () => {
    const metadata = { existing: true, compliance: { something: 'else' } };
    const verification = { status: 'verified', placeId: 123 };
    const result = attachOpenStreetMapMetadata(metadata, verification);
    expect(result).toMatchObject({
      existing: true,
      compliance: {
        something: 'else',
        openStreetMap: verification
      }
    });
  });

  it('verifies polygons against the OpenStreetMap endpoint', async () => {
    const geometry = buildMultiPolygon();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: 'London',
        place_id: 42,
        boundingbox: ['51.48', '51.53', '-0.16', '-0.09'],
        licence: 'Data © OpenStreetMap contributors'
      })
    });

    const verification = await enforceOpenStreetMapCompliance(geometry, { fetchImpl: fetchSpy });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(verification).toMatchObject({
      status: 'verified',
      displayName: 'London',
      placeId: 42,
      boundingBox: {
        south: expect.any(Number),
        north: expect.any(Number),
        west: expect.any(Number),
        east: expect.any(Number)
      }
    });
  });

  it('throws when the endpoint cannot locate the geometry', async () => {
    const geometry = buildMultiPolygon();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: 'not found' })
    });

    await expect(enforceOpenStreetMapCompliance(geometry, { fetchImpl: fetchSpy })).rejects.toThrow(
      /not found/i
    );
  });
});
