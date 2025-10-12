import turfBbox from '@turf/bbox';
import { featureCollection, feature } from '@turf/helpers';

export const EXPLORER_DEFAULT_FILTERS = {
  term: '',
  type: 'all',
  zoneId: 'all',
  availability: 'any',
  demand: ['high', 'medium', 'low'],
  limit: 50
};

export function parseFiltersFromSearchParams(searchParams) {
  if (!searchParams) {
    return { ...EXPLORER_DEFAULT_FILTERS };
  }

  const params = Object.fromEntries(searchParams.entries());
  return {
    ...EXPLORER_DEFAULT_FILTERS,
    term: params.q ?? EXPLORER_DEFAULT_FILTERS.term,
    type: ['all', 'services', 'marketplace'].includes(params.type) ? params.type : EXPLORER_DEFAULT_FILTERS.type,
    zoneId: params.zoneId ?? EXPLORER_DEFAULT_FILTERS.zoneId,
    availability: ['any', 'rent', 'buy', 'both'].includes(params.availability)
      ? params.availability
      : EXPLORER_DEFAULT_FILTERS.availability,
    demand: params.demand ? params.demand.split(',').filter(Boolean) : EXPLORER_DEFAULT_FILTERS.demand,
    limit: Number.parseInt(params.limit, 10) > 0 ? Number.parseInt(params.limit, 10) : EXPLORER_DEFAULT_FILTERS.limit
  };
}

export function toSearchParams(filters) {
  const params = new URLSearchParams();

  if (filters.term) {
    params.set('q', filters.term);
  }

  if (filters.type && filters.type !== 'all') {
    params.set('type', filters.type);
  }

  if (filters.zoneId && filters.zoneId !== 'all') {
    params.set('zoneId', filters.zoneId);
  }

  if (filters.availability && filters.availability !== 'any') {
    params.set('availability', filters.availability);
  }

  if (Array.isArray(filters.demand) && filters.demand.length < EXPLORER_DEFAULT_FILTERS.demand.length) {
    params.set('demand', filters.demand.join(','));
  }

  if (filters.limit && filters.limit !== EXPLORER_DEFAULT_FILTERS.limit) {
    params.set('limit', String(filters.limit));
  }

  return params;
}

function matchesZoneDemand(zone, filters) {
  if (!Array.isArray(filters.demand) || filters.demand.length === 0) {
    return true;
  }

  return filters.demand.includes(zone.demandLevel ?? 'medium');
}

export function filterZonesByDemand(zones, filters) {
  if (!Array.isArray(zones) || zones.length === 0) {
    return [];
  }

  return zones.filter((zone) => matchesZoneDemand(zone, filters));
}

function filterServicesByZone(services, zone, zonesByCompany) {
  if (!zone) {
    return services;
  }

  const companyId = zone.companyId;
  return services.filter((service) => {
    if (service.companyId === companyId) {
      return true;
    }

    if (!service.companyId && service.Company?.id) {
      return service.Company.id === companyId;
    }

    return false;
  });
}

function filterItemsByZone(items, zone) {
  if (!zone) {
    return items;
  }

  return items.filter((item) => item.companyId === zone.companyId);
}

export function applyExplorerFilters({ services, items }, filters, zones) {
  const zonesById = new Map((zones || []).map((zone) => [zone.id, zone]));
  const selectedZone = filters.zoneId && filters.zoneId !== 'all' ? zonesById.get(filters.zoneId) : null;

  const filteredServices = filterServicesByZone(services, selectedZone, zonesById);
  const filteredItems = filterItemsByZone(items, selectedZone);

  const typedServices = filters.type === 'marketplace' ? [] : filteredServices;
  const typedItems = filters.type === 'services' ? [] : filteredItems;

  const availabilityFilteredItems =
    filters.availability === 'any'
      ? typedItems
      : typedItems.filter((item) => item.availability === filters.availability || item.availability === 'both');

  return {
    services: typedServices,
    items: availabilityFilteredItems,
    selectedZone
  };
}

export function computeZoneMatchIndex(results, zones) {
  const index = new Map();

  if (!zones || zones.length === 0) {
    return index;
  }

  const zoneByCompany = new Map();
  zones.forEach((zone) => {
    const companyZones = zoneByCompany.get(zone.companyId) ?? [];
    companyZones.push(zone.id);
    zoneByCompany.set(zone.companyId, companyZones);
  });

  const increment = (zoneId, type) => {
    const current = index.get(zoneId) ?? { services: 0, items: 0 };
    current[type] += 1;
    index.set(zoneId, current);
  };

  results.services.forEach((service) => {
    const companyId = service.companyId ?? service.Company?.id;
    const zoneIds = zoneByCompany.get(companyId);
    if (!zoneIds) {
      return;
    }

    zoneIds.forEach((zoneId) => increment(zoneId, 'services'));
  });

  results.items.forEach((item) => {
    const zoneIds = zoneByCompany.get(item.companyId);
    if (!zoneIds) {
      return;
    }

    zoneIds.forEach((zoneId) => increment(zoneId, 'items'));
  });

  zones.forEach((zone) => {
    const counts = index.get(zone.id);
    if (!counts) {
      index.set(zone.id, { services: 0, items: 0 });
    }
  });

  return index;
}

export function summariseZoneAnalytics(zone) {
  if (!zone?.analytics) {
    return {
      openBookings: 0,
      slaBreaches: 0,
      averageAcceptanceMinutes: null
    };
  }

  const totals = zone.analytics.bookingTotals ?? {};
  const openStatuses = Object.entries(totals).filter(([status]) => !['completed', 'cancelled', 'disputed'].includes(status));
  const openBookings = openStatuses.reduce((sum, [, value]) => sum + Number(value ?? 0), 0);

  return {
    openBookings,
    slaBreaches: Number(zone.analytics.slaBreaches ?? 0),
    averageAcceptanceMinutes: zone.analytics.averageAcceptanceMinutes ?? null
  };
}

export function buildZoneFeatureCollection(zones, matchIndex) {
  const features = zones
    .filter((zone) => zone.boundary)
    .map((zone) =>
      feature(zone.boundary, {
        id: zone.id,
        name: zone.name,
        demand: zone.demandLevel,
        companyId: zone.companyId,
        matches: matchIndex.get(zone.id) ?? { services: 0, items: 0 }
      })
    );

  return featureCollection(features);
}

export function determineExplorerBounds(zones) {
  const features = zones.filter((zone) => zone.boundary).map((zone) => feature(zone.boundary));
  if (features.length === 0) {
    return null;
  }

  return turfBbox(featureCollection(features));
}

export function extractServiceCategories(services) {
  const categories = new Set();
  services.forEach((service) => {
    if (service.category) {
      categories.add(service.category);
    }
  });

  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}
