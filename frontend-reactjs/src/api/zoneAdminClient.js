import { PanelApiError } from './panelClient.js';

function normaliseResponse(response) {
  if (!response.ok) {
    throw new PanelApiError('Unable to process zone request', response.status);
  }
  return response.json();
}

export async function fetchZonesWithAnalytics({ signal } = {}) {
  const response = await fetch('/api/zones?includeAnalytics=true', { signal });
  if (!response.ok) {
    throw new PanelApiError('Unable to load service zones', response.status);
  }
  return response.json();
}

export async function createZone(payload, { signal } = {}) {
  const response = await fetch('/api/zones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });
  return normaliseResponse(response);
}

export async function updateZone(zoneId, payload, { signal } = {}) {
  const response = await fetch(`/api/zones/${zoneId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });
  return normaliseResponse(response);
}

export async function deleteZone(zoneId, { signal } = {}) {
  const response = await fetch(`/api/zones/${zoneId}`, {
    method: 'DELETE',
    signal
  });
  if (!response.ok && response.status !== 404) {
    throw new PanelApiError('Unable to remove service zone', response.status);
  }
  return true;
}

export async function fetchZone(zoneId, { signal } = {}) {
  const response = await fetch(`/api/zones/${zoneId}`, { signal });
  if (!response.ok) {
    throw new PanelApiError('Unable to load service zone', response.status);
  }
  return response.json();
}

export async function createZoneAnalyticsSnapshot(zoneId, { signal } = {}) {
  const response = await fetch(`/api/zones/${zoneId}/analytics/snapshot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal
  });
  return normaliseResponse(response);
}

export async function importZonesFromGeoJson(payload, { signal } = {}) {
  const response = await fetch('/api/zones/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });
  return normaliseResponse(response);
}

export async function fetchZoneServices(zoneId, { signal } = {}) {
  const response = await fetch(`/api/zones/${zoneId}/services`, { signal });
  if (!response.ok) {
    throw new PanelApiError('Unable to load zone services', response.status);
  }
  return response.json();
}

export async function syncZoneServices(zoneId, payload, { signal } = {}) {
  const response = await fetch(`/api/zones/${zoneId}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });
  return normaliseResponse(response);
}

export async function removeZoneService(zoneId, coverageId, { signal, actor } = {}) {
  const response = await fetch(`/api/zones/${zoneId}/services/${coverageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: actor ? JSON.stringify({ actor }) : undefined,
    signal
  });
  if (!response.ok && response.status !== 404) {
    throw new PanelApiError('Unable to detach service from zone', response.status);
  }
  return true;
}
