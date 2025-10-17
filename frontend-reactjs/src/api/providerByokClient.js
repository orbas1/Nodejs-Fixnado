const API_ROOT = '/api/analytics/dashboards/provider/byok';

const memoryCache = new Map();

function buildHeaders() {
  return new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
}

async function request(path, { method = 'GET', body, signal, cacheKey, ttl = 15000, forceRefresh = false } = {}) {
  const key = cacheKey ?? `${method}:${path}`;
  const now = Date.now();

  if (!forceRefresh && method === 'GET' && memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (entry.expires > now) {
      return entry.value;
    }
    memoryCache.delete(key);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const sourceSignal = signal;
  if (sourceSignal) {
    if (sourceSignal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      sourceSignal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener('abort', () => sourceSignal.removeEventListener('abort', abort), { once: true });
    }
  }

  try {
    const response = await fetch(path, {
      method,
      headers: buildHeaders(),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {};
      }
      const error = new Error(errorBody?.message || response.statusText || 'BYOK request failed');
      error.status = response.status;
      error.details = errorBody?.details;
      throw error;
    }

    const payload = await response.json();
    if (method === 'GET') {
      memoryCache.set(key, { value: payload, expires: now + ttl });
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProviderByokSnapshot({ signal, forceRefresh } = {}) {
  const payload = await request(API_ROOT, {
    signal,
    forceRefresh,
    cacheKey: 'provider:byok:snapshot'
  });
  return payload;
}

export async function createProviderByokIntegration(body, { signal } = {}) {
  memoryCache.delete('provider:byok:snapshot');
  const response = await request(API_ROOT, { method: 'POST', body, signal });
  return response?.data ?? response;
}

export async function updateProviderByokIntegration(id, body, { signal } = {}) {
  memoryCache.delete('provider:byok:snapshot');
  const response = await request(`${API_ROOT}/${encodeURIComponent(id)}`, { method: 'PUT', body, signal });
  return response?.data ?? response;
}

export async function archiveProviderByokIntegration(id, { signal } = {}) {
  memoryCache.delete('provider:byok:snapshot');
  const response = await request(`${API_ROOT}/${encodeURIComponent(id)}`, { method: 'DELETE', signal });
  return response?.data ?? response;
}

export async function testProviderByokIntegration(id, { signal } = {}) {
  const response = await request(`${API_ROOT}/${encodeURIComponent(id)}/test`, { method: 'POST', signal });
  memoryCache.delete('provider:byok:snapshot');
  return response;
}

export async function listProviderByokAuditLogs(id = null, { limit = 25, signal } = {}) {
  const params = new URLSearchParams();
  if (Number.isFinite(limit)) {
    params.set('limit', String(Math.max(1, Math.min(limit, 100))));
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const path = id ? `${API_ROOT}/${encodeURIComponent(id)}/audit${suffix}` : `${API_ROOT}/audit${suffix}`;
  const cacheKey = id ? `provider:byok:audit:${id}` : 'provider:byok:audit:all';
  const payload = await request(path, { signal, cacheKey, ttl: 10000, forceRefresh: true });
  return payload?.data ?? payload;
}

export function resetProviderByokCache() {
  memoryCache.delete('provider:byok:snapshot');
}

export default {
  fetchProviderByokSnapshot,
  createProviderByokIntegration,
  updateProviderByokIntegration,
  archiveProviderByokIntegration,
  testProviderByokIntegration,
  listProviderByokAuditLogs,
  resetProviderByokCache
};
