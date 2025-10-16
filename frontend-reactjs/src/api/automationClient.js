const API_ROOT = '/api/admin/automation/backlog';

const memoryCache = new Map();

function buildHeaders(extra = {}) {
  const headers = new Headers({ Accept: 'application/json', ...extra });
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function request(path, { method = 'GET', body, signal, cacheKey, ttl = 10000, forceRefresh = false } = {}) {
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
  const timeout = setTimeout(() => controller.abort(), 15000);
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
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include'
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {};
      }
      const error = new Error(errorBody?.message || response.statusText || 'Automation request failed');
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

export async function listAutomationBacklog({ includeArchived = false, signal, forceRefresh } = {}) {
  const params = new URLSearchParams();
  if (includeArchived) {
    params.set('includeArchived', 'true');
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await request(`${API_ROOT}${suffix}`, {
    signal,
    forceRefresh,
    cacheKey: includeArchived ? 'automation:backlog:all' : 'automation:backlog:active',
    ttl: 15000
  });
  return response?.data ?? response;
}

export async function createAutomationBacklogItem(body, { signal } = {}) {
  memoryCache.delete('automation:backlog:active');
  memoryCache.delete('automation:backlog:all');
  const response = await request(API_ROOT, { method: 'POST', body, signal });
  return response?.data ?? response;
}

export async function updateAutomationBacklogItem(id, body, { signal } = {}) {
  memoryCache.delete('automation:backlog:active');
  memoryCache.delete('automation:backlog:all');
  const response = await request(`${API_ROOT}/${id}`, { method: 'PATCH', body, signal });
  return response?.data ?? response;
}

export async function archiveAutomationBacklogItem(id, { signal } = {}) {
  memoryCache.delete('automation:backlog:active');
  memoryCache.delete('automation:backlog:all');
  const response = await request(`${API_ROOT}/${id}`, { method: 'DELETE', signal });
  return response?.data ?? response;
}

export function resetAutomationBacklogCache() {
  memoryCache.delete('automation:backlog:active');
  memoryCache.delete('automation:backlog:all');
}
