import { PanelApiError } from './panelClient.js';

export async function matchGeoServices(payload, { signal } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const headers = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });

  const requestPayload = {
    latitude: payload.latitude,
    longitude: payload.longitude,
    radiusKm: payload.radiusKm,
    limit: payload.limit,
    demandLevels: Array.isArray(payload.demandLevels) ? payload.demandLevels : undefined,
    categories: Array.isArray(payload.categories) ? payload.categories : undefined
  };

  try {
    const response = await fetch('/api/zones/match', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
      credentials: 'include',
      signal: signal || controller.signal
    });

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch {
        // ignore JSON parse failures
      }
      const message = errorBody?.message || response.statusText || 'Unable to match services';
      throw new PanelApiError(message, response.status, { cause: errorBody });
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new PanelApiError('Request timed out', 408, { cause: error });
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while matching services', 503, { cause: error });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function previewCoverage(payload, { signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });

  const params = new URLSearchParams();
  if (payload.latitude != null) params.set('latitude', String(payload.latitude));
  if (payload.longitude != null) params.set('longitude', String(payload.longitude));
  if (payload.radiusKm != null) params.set('radiusKm', String(payload.radiusKm));

  const response = await fetch(`/api/zones/coverage/preview?${params.toString()}`, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal
  });

  if (!response.ok) {
    throw new PanelApiError('Unable to preview coverage window', response.status);
  }

  return response.json();
}
