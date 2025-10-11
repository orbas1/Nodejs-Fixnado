const DEFAULT_LIMIT = 50;

class ExplorerApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = 'ExplorerApiError';
    this.status = status;
    if (cause) {
      this.cause = cause;
    }
  }
}

async function handleResponse(response) {
  if (response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  const errorMessage = await response
    .json()
    .catch(() => ({ message: `Explorer request failed with status ${response.status}` }));

  throw new ExplorerApiError(errorMessage.message || 'Explorer request failed', {
    status: response.status
  });
}

export async function fetchExplorerResults(filters, { signal } = {}) {
  const params = new URLSearchParams();

  if (filters?.term) {
    params.set('q', filters.term);
  }

  params.set('limit', String(filters?.limit ?? DEFAULT_LIMIT));

  const response = await fetch(`/api/search?${params.toString()}`, { signal });
  const payload = await handleResponse(response);

  return {
    services: Array.isArray(payload?.services) ? payload.services : [],
    items: Array.isArray(payload?.items) ? payload.items : []
  };
}

export async function fetchTalent(term, { signal } = {}) {
  if (!term) {
    return [];
  }

  const params = new URLSearchParams({ q: term });
  const response = await fetch(`/api/search/talent?${params.toString()}`, { signal });
  const payload = await handleResponse(response);
  return Array.isArray(payload) ? payload : [];
}

function normaliseGeometry(geometry) {
  if (!geometry) {
    return null;
  }

  const source = geometry.geometry || geometry;

  if (source.type === 'MultiPolygon') {
    return source;
  }

  if (source.type === 'Polygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [source.coordinates]
    };
  }

  return null;
}

function parseGeometry(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    try {
      return parseGeometry(JSON.parse(raw));
    } catch (error) {
      throw new ExplorerApiError('Unable to parse zone boundary geometry', { cause: error });
    }
  }

  if (raw.type === 'FeatureCollection') {
    const [firstFeature] = raw.features || [];
    return normaliseGeometry(firstFeature?.geometry);
  }

  if (raw.type === 'Feature') {
    return normaliseGeometry(raw);
  }

  return normaliseGeometry(raw);
}

function parsePoint(raw) {
  if (!raw) {
    return null;
  }

  if (typeof raw === 'string') {
    try {
      return parsePoint(JSON.parse(raw));
    } catch (error) {
      throw new ExplorerApiError('Unable to parse zone centroid geometry', { cause: error });
    }
  }

  if (raw.type === 'Feature') {
    return raw.geometry;
  }

  return raw;
}

export async function fetchZones({ signal } = {}) {
  const response = await fetch('/api/zones?includeAnalytics=true', { signal });
  const payload = await handleResponse(response);

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry) => {
    const zone = entry.zone ?? entry;
    return {
      id: zone.id,
      name: zone.name,
      companyId: zone.companyId,
      demandLevel: zone.demandLevel,
      metadata: zone.metadata ?? {},
      boundary: parseGeometry(zone.boundary),
      centroid: parsePoint(zone.centroid),
      boundingBox: zone.boundingBox ?? null,
      analytics: entry.analytics ?? null
    };
  });
}

export { ExplorerApiError };
