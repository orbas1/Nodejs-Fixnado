import turfBbox from '@turf/bbox';
import { featureCollection, feature } from '@turf/helpers';

export const EXPLORER_DEFAULT_FILTERS = {
  term: '',
  type: 'all',
  zoneId: 'all',
  availability: 'any',
  demand: ['high', 'medium', 'low'],
  serviceType: 'all',
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
    serviceType: params.serviceType ?? EXPLORER_DEFAULT_FILTERS.serviceType,
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

  if (filters.serviceType && filters.serviceType !== 'all') {
    params.set('serviceType', filters.serviceType);
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

function filterServicesByZone(services, zone) {
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

  const filteredServices = filterServicesByZone(services, selectedZone);
  const filteredItems = filterItemsByZone(items, selectedZone);

  const typedServices = filters.type === 'marketplace' ? [] : filteredServices;
  const typedItems = filters.type === 'services' ? [] : filteredItems;

  const availabilityFilteredItems =
    filters.availability === 'any'
      ? typedItems
      : typedItems.filter((item) => item.availability === filters.availability || item.availability === 'both');

  const { services: rankedServices, items: rankedItems } = rankExplorerResults(
    { services: typedServices, items: availabilityFilteredItems },
    {
      selectedZone,
      filters
    }
  );

  return {
    services: rankedServices,
    items: rankedItems,
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
  const categories = new Map();
  services.forEach((service) => {
    const slug = (service.categorySlug || service.category || '').toString().trim();
    if (!slug) {
      return;
    }

    const key = slug.toLowerCase();
    if (!categories.has(key)) {
      categories.set(key, {
        value: slug,
        label: service.category || service.categorySlug || slug
      });
    }
  });

  return Array.from(categories.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function normaliseTerm(term) {
  return term?.toString().trim().toLowerCase() ?? '';
}

function textContainsTerm(text, term) {
  if (!term) {
    return 0;
  }

  const normalised = normaliseTerm(text);
  if (!normalised) {
    return 0;
  }

  if (normalised.includes(term)) {
    return 1;
  }

  const tokens = normalised.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.length === 0) {
    return 0;
  }

  const matches = tokens.filter((token) => token.startsWith(term));
  return Math.min(1, matches.length / tokens.length);
}

function demandWeight(level) {
  switch ((level || '').toLowerCase()) {
    case 'high':
      return 0.18;
    case 'medium':
      return 0.12;
    case 'low':
      return 0.06;
    default:
      return 0.1;
  }
}

function complianceScoreFromCompany(service) {
  const candidate =
    service?.complianceScore ?? service?.Company?.complianceScore ?? service?.Company?.compliance_snapshot?.score;

  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : null;
}

function companyIdForService(service) {
  if (!service) {
    return null;
  }
  if (service.companyId) {
    return service.companyId;
  }
  if (service.Company?.id) {
    return service.Company.id;
  }
  return null;
}

function computeServiceScore(service, { selectedZone, filters }) {
  let score = 0.4;
  const zoneCompanyId = selectedZone?.companyId;
  const serviceCompanyId = companyIdForService(service);

  if (zoneCompanyId && serviceCompanyId && zoneCompanyId === serviceCompanyId) {
    score += 0.32 + demandWeight(selectedZone?.demandLevel ?? '');
  }

  const compliance = complianceScoreFromCompany(service);
  if (compliance != null) {
    score += Math.min(1, compliance / 100) * 0.22;
  }

  const price = Number(service.price ?? service.metadata?.price);
  if (Number.isFinite(price) && price > 0) {
    const normalised = Math.min(1, 1 / Math.log10(price + 10));
    score += normalised * 0.1;
  } else {
    score -= 0.02;
  }

  if (Array.isArray(service.tags) && service.tags.length > 0) {
    score += Math.min(0.08, service.tags.length * 0.02);
  }

  const term = normaliseTerm(filters?.term);
  if (term) {
    const textMatch = textContainsTerm(`${service.title} ${service.description ?? ''}`, term);
    score += textMatch * 0.15;
  }

  return score;
}

function companyIdForItem(item) {
  if (!item) {
    return null;
  }
  if (item.companyId) {
    return item.companyId;
  }
  if (item.Company?.id) {
    return item.Company.id;
  }
  return null;
}

function computeMarketplaceItemScore(item, { selectedZone, filters }) {
  let score = 0.35;

  const zoneCompanyId = selectedZone?.companyId;
  const itemCompanyId = companyIdForItem(item);
  if (zoneCompanyId && itemCompanyId && zoneCompanyId === itemCompanyId) {
    score += 0.28 + demandWeight(selectedZone?.demandLevel ?? '');
  }

  const status = item.status?.toString().toLowerCase() ?? '';
  if (status.includes('approved') || status.includes('live')) {
    score += 0.12;
  } else if (status.includes('hold') || status.includes('pending')) {
    score -= 0.06;
  }

  if (item.supportsRental) {
    score += 0.07;
  }

  const availabilityFilter = (filters?.availability || '').toLowerCase();
  if (availabilityFilter && availabilityFilter !== 'any') {
    const availability = item.availability?.toString().toLowerCase() ?? '';
    if (availability.includes(availabilityFilter) || (availabilityFilter === 'rent' && item.supportsRental)) {
      score += 0.1;
    } else {
      score -= 0.08;
    }
  }

  const pricePerDay = Number(item.pricePerDay);
  if (Number.isFinite(pricePerDay) && pricePerDay > 0) {
    const normalised = Math.min(1, 1 / Math.log10(pricePerDay + 10));
    score += normalised * 0.08;
  }

  const purchasePrice = Number(item.purchasePrice);
  if (Number.isFinite(purchasePrice) && purchasePrice > 0) {
    const normalised = Math.min(1, 1 / Math.log10(purchasePrice + 25));
    score += normalised * 0.05;
  }

  if (item.insuredOnly) {
    score += 0.03;
  }

  const term = normaliseTerm(filters?.term);
  if (term) {
    const textMatch = textContainsTerm(`${item.title} ${item.description ?? ''}`, term);
    score += textMatch * 0.12;
  }

  return score;
}

function sortByScore(items, scorer) {
  return items.slice().sort((a, b) => scorer(b) - scorer(a));
}

export function rankExplorerResults(results, { selectedZone, filters }) {
  const rankedServices = sortByScore(results.services ?? [], (service) =>
    computeServiceScore(service, { selectedZone, filters })
  );

  const rankedItems = sortByScore(results.items ?? [], (item) =>
    computeMarketplaceItemScore(item, { selectedZone, filters })
  );

  return {
    services: rankedServices,
    items: rankedItems
  };
}

export function computeExplorerServiceScore(service, context) {
  return computeServiceScore(service, context);
}

export function computeExplorerMarketplaceScore(item, context) {
  return computeMarketplaceItemScore(item, context);
}
