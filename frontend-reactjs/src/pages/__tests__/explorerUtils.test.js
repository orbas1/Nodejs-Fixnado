import { describe, expect, it } from 'vitest';
import {
  EXPLORER_DEFAULT_FILTERS,
  parseFiltersFromSearchParams,
  toSearchParams,
  applyExplorerFilters,
  computeZoneMatchIndex,
  summariseZoneAnalytics,
  buildZoneFeatureCollection,
  determineExplorerBounds,
  filterZonesByDemand
} from '../explorerUtils.js';

const londonZone = {
  id: 'zone-london',
  name: 'London Priority',
  companyId: 'company-1',
  demandLevel: 'high',
  boundary: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [-0.5, 51.3],
          [-0.1, 51.3],
          [-0.1, 51.7],
          [-0.5, 51.7],
          [-0.5, 51.3]
        ]
      ]
    ]
  },
  analytics: {
    bookingTotals: { pending: 3, completed: 9 },
    slaBreaches: 1,
    averageAcceptanceMinutes: 22
  }
};

const manchesterZone = {
  id: 'zone-manchester',
  name: 'Manchester Growth',
  companyId: 'company-2',
  demandLevel: 'medium',
  boundary: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [-2.4, 53.3],
          [-1.9, 53.3],
          [-1.9, 53.6],
          [-2.4, 53.6],
          [-2.4, 53.3]
        ]
      ]
    ]
  }
};

describe('explorerUtils', () => {
  it('parses and serialises filters', () => {
    const params = new URLSearchParams({ q: 'plumbing', type: 'services', demand: 'high,medium' });
    const parsed = parseFiltersFromSearchParams(params);
    expect(parsed.term).toBe('plumbing');
    expect(parsed.type).toBe('services');
    expect(parsed.demand).toEqual(['high', 'medium']);

    const serialised = toSearchParams(parsed);
    expect(serialised.get('q')).toBe('plumbing');
    expect(serialised.get('type')).toBe('services');
    expect(serialised.get('demand')).toBe('high,medium');
  });

  it('applies zone and availability filters', () => {
    const services = [
      { id: 'svc-1', companyId: 'company-1', category: 'HVAC' },
      { id: 'svc-2', companyId: 'company-2', category: 'Electrical' }
    ];
    const items = [
      { id: 'item-1', companyId: 'company-1', availability: 'rent' },
      { id: 'item-2', companyId: 'company-2', availability: 'buy' }
    ];

    const result = applyExplorerFilters(
      { services, items },
      { ...EXPLORER_DEFAULT_FILTERS, zoneId: 'zone-london', availability: 'rent' },
      [londonZone, manchesterZone]
    );

    expect(result.services).toHaveLength(1);
    expect(result.services[0].id).toBe('svc-1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('item-1');
    expect(result.selectedZone.id).toBe('zone-london');
  });

  it('computes match index for zones', () => {
    const matches = computeZoneMatchIndex(
      {
        services: [{ id: 'svc-1', companyId: 'company-1' }],
        items: [{ id: 'item-1', companyId: 'company-2' }]
      },
      [londonZone, manchesterZone]
    );

    expect(matches.get('zone-london')).toEqual({ services: 1, items: 0 });
    expect(matches.get('zone-manchester')).toEqual({ services: 0, items: 1 });
  });

  it('summarises analytics for a zone', () => {
    const summary = summariseZoneAnalytics(londonZone);
    expect(summary.openBookings).toBe(3);
    expect(summary.slaBreaches).toBe(1);
    expect(summary.averageAcceptanceMinutes).toBe(22);
  });

  it('builds feature collection and determines bounds', () => {
    const features = buildZoneFeatureCollection([londonZone, manchesterZone], new Map());
    expect(features.features).toHaveLength(2);

    const bounds = determineExplorerBounds([londonZone, manchesterZone]);
    expect(bounds).toHaveLength(4);
    expect(bounds[0]).toBeLessThan(bounds[2]);
  });

  it('filters zones by demand levels', () => {
    const filtered = filterZonesByDemand([londonZone, manchesterZone], {
      ...EXPLORER_DEFAULT_FILTERS,
      demand: ['high']
    });

    expect(filtered).toEqual([londonZone]);
  });
});
