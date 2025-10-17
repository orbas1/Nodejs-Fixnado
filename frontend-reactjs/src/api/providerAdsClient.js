const ROOT = '/api/panel/provider/campaigns';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener('abort', () => signal.removeEventListener('abort', abort), { once: true });
    }
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    const networkError = new Error('Unable to contact provider campaign services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[providerAdsClient] failed to parse JSON response', error);
    }
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

export async function fetchProviderAdsWorkspace(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/workspace${query}`, options);
}

export async function createProviderCampaign(payload, options = {}) {
  return request(`${ROOT}`, { method: 'POST', body: payload, ...options });
}

export async function updateProviderCampaign(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}`, { method: 'PATCH', body: payload, ...options });
}

export async function createProviderCampaignFlight(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/flights`, { method: 'POST', body: payload, ...options });
}

export async function saveProviderTargeting(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/targeting`, { method: 'PUT', body: payload, ...options });
}

export async function createProviderCreative(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/creatives`, { method: 'POST', body: payload, ...options });
}

export async function updateProviderCreative(campaignId, creativeId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/creatives/${creativeId}`, { method: 'PATCH', body: payload, ...options });
}

export async function deleteProviderCreative(campaignId, creativeId, options = {}) {
  return request(`${ROOT}/${campaignId}/creatives/${creativeId}`, { method: 'DELETE', ...options });
}

export async function saveProviderAudienceSegments(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/audience-segments`, { method: 'PUT', body: payload, ...options });
}

export async function saveProviderPlacements(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/placements`, { method: 'PUT', body: payload, ...options });
}

export async function recordProviderMetrics(campaignId, payload, options = {}) {
  return request(`${ROOT}/${campaignId}/metrics`, { method: 'POST', body: payload, ...options });
}

export default {
  fetchProviderAdsWorkspace,
  createProviderCampaign,
  updateProviderCampaign,
  createProviderCampaignFlight,
  saveProviderTargeting,
  createProviderCreative,
  updateProviderCreative,
  deleteProviderCreative,
  saveProviderAudienceSegments,
  saveProviderPlacements,
  recordProviderMetrics
};
