const ROOT = '/api/servicemen';

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
    const networkError = new Error('Unable to contact Serviceman BYOK services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[servicemanByokClient] Failed to parse JSON response', error);
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

export async function fetchByokState(servicemanId, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok`, options);
}

export async function saveByokProfile(servicemanId, payload, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok/profile`, { method: 'PUT', body: payload, ...options });
}

export async function createByokConnector(servicemanId, payload, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok/connectors`, { method: 'POST', body: payload, ...options });
}

export async function updateByokConnector(servicemanId, connectorId, payload, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok/connectors/${connectorId}`, {
    method: 'PUT',
    body: payload,
    ...options
  });
}

export async function deleteByokConnector(servicemanId, connectorId, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok/connectors/${connectorId}`, { method: 'DELETE', ...options });
}

export async function rotateByokConnector(servicemanId, connectorId, payload, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok/connectors/${connectorId}/rotate`, {
    method: 'POST',
    body: payload,
    ...options
  });
}

export async function runByokDiagnostic(servicemanId, connectorId, options = {}) {
  return request(`${ROOT}/${servicemanId}/byok/connectors/${connectorId}/diagnostics`, {
    method: 'POST',
    ...options
  });
}

export async function searchByokProfiles(query = {}, options = {}) {
  const params = new URLSearchParams();
  if (query.search) {
    params.set('search', query.search);
  }
  if (query.limit) {
    params.set('limit', query.limit);
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request(`${ROOT}/byok/profiles${suffix}`, options);
}

export default {
  fetchByokState,
  saveByokProfile,
  createByokConnector,
  updateByokConnector,
  deleteByokConnector,
  rotateByokConnector,
  runByokDiagnostic,
  searchByokProfiles
};
