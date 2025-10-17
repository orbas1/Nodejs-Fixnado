const ROOT = '/api/fixnado/ads';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
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
    const networkError = new Error('Unable to reach Fixnado Ads services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[fixnadoAdsClient] failed to parse JSON response', error);
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

export async function listFixnadoCampaigns(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/campaigns${query}`, options);
}

export async function createFixnadoCampaign(payload, options = {}) {
  return request(`${ROOT}/campaigns`, { method: 'POST', body: payload, ...options });
}

export async function getFixnadoCampaign(campaignId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/campaigns/${campaignId}${query}`, options);
}

export async function updateFixnadoCampaign(campaignId, payload, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}`, { method: 'PATCH', body: payload, ...options });
}

export async function createFixnadoFlight(campaignId, payload, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}/flights`, { method: 'POST', body: payload, ...options });
}

export async function saveFixnadoTargetingRules(campaignId, rules, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}/targeting`, {
    method: 'PUT',
    body: { rules },
    ...options
  });
}

export async function recordFixnadoMetric(campaignId, payload, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}/metrics`, { method: 'POST', body: payload, ...options });
}

export async function listFixnadoFraudSignals(campaignId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/campaigns/${campaignId}/fraud-signals${query}`, options);
}

export async function resolveFixnadoFraudSignal(signalId, payload = {}, options = {}) {
  return request(`${ROOT}/fraud-signals/${signalId}/resolve`, { method: 'POST', body: payload, ...options });
}

export async function getFixnadoCampaignSummary(campaignId, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}/summary`, options);
}

export async function listFixnadoCreatives(campaignId, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}/creatives`, options);
}

export async function createFixnadoCreative(campaignId, payload, options = {}) {
  return request(`${ROOT}/campaigns/${campaignId}/creatives`, { method: 'POST', body: payload, ...options });
}

export async function updateFixnadoCreative(creativeId, payload, options = {}) {
  return request(`${ROOT}/creatives/${creativeId}`, { method: 'PATCH', body: payload, ...options });
}

export async function deleteFixnadoCreative(creativeId, options = {}) {
  return request(`${ROOT}/creatives/${creativeId}`, { method: 'DELETE', ...options });
}

export default {
  listFixnadoCampaigns,
  createFixnadoCampaign,
  getFixnadoCampaign,
  updateFixnadoCampaign,
  createFixnadoFlight,
  saveFixnadoTargetingRules,
  recordFixnadoMetric,
  listFixnadoFraudSignals,
  resolveFixnadoFraudSignal,
  getFixnadoCampaignSummary,
  listFixnadoCreatives,
  createFixnadoCreative,
  updateFixnadoCreative,
  deleteFixnadoCreative
};
