const ADMIN_MARKETPLACE_ROOT = '/api/admin/marketplace';

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
    const networkError = new Error('Unable to reach admin marketplace services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[marketplaceAdminClient] failed to parse JSON response', error);
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

export async function fetchMarketplaceOverview(params = {}) {
  const query = buildQuery(params);
  return request(`${ADMIN_MARKETPLACE_ROOT}/overview${query}`);
}

export async function createMarketplaceTool(payload) {
  return request(`${ADMIN_MARKETPLACE_ROOT}/tools`, { method: 'POST', body: payload });
}

export async function updateMarketplaceTool(itemId, payload) {
  return request(`${ADMIN_MARKETPLACE_ROOT}/tools/${itemId}`, { method: 'PATCH', body: payload });
}

export async function deleteMarketplaceTool(itemId) {
  return request(`${ADMIN_MARKETPLACE_ROOT}/tools/${itemId}`, { method: 'DELETE' });
}

export async function createMarketplaceMaterial(payload) {
  return request(`${ADMIN_MARKETPLACE_ROOT}/materials`, { method: 'POST', body: payload });
}

export async function updateMarketplaceMaterial(itemId, payload) {
  return request(`${ADMIN_MARKETPLACE_ROOT}/materials/${itemId}`, { method: 'PATCH', body: payload });
}

export async function deleteMarketplaceMaterial(itemId) {
  return request(`${ADMIN_MARKETPLACE_ROOT}/materials/${itemId}`, { method: 'DELETE' });
}
