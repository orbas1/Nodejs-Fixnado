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
