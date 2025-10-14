const API_ROOT = '/api/affiliate';
const ADMIN_API_ROOT = '/api/admin/affiliate';
const TOKEN_KEY = 'fixnado:accessToken';

const memoryCache = new Map();

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage?.getItem(TOKEN_KEY) ?? null;
  } catch (error) {
    console.warn('[affiliateClient] Unable to read auth token', error);
    return null;
  }
}

function buildHeaders(extra = {}) {
  const headers = new Headers({ Accept: 'application/json', ...extra });
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
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
  const timeout = setTimeout(() => controller.abort(), 10000);
  const abortSignal = signal;
  if (abortSignal) {
    if (abortSignal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      abortSignal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener('abort', () => abortSignal.removeEventListener('abort', abort), { once: true });
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
      const error = new Error(errorBody?.message || response.statusText || 'Affiliate request failed');
      error.status = response.status;
      error.code = errorBody?.code;
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

export async function getAffiliateDashboard({ signal, forceRefresh } = {}) {
  const payload = await request(`${API_ROOT}/dashboard`, {
    signal,
    forceRefresh,
    cacheKey: 'affiliate:dashboard',
    ttl: 15000
  });
  return payload?.data ?? payload;
}

export async function getAffiliateReferrals({ signal, forceRefresh } = {}) {
  const payload = await request(`${API_ROOT}/referrals`, {
    signal,
    forceRefresh,
    cacheKey: 'affiliate:referrals',
    ttl: 15000
  });
  return payload?.data ?? payload;
}

export async function getAdminAffiliateSettings({ signal, forceRefresh } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/settings`, {
    signal,
    forceRefresh,
    cacheKey: 'affiliate:admin:settings',
    ttl: 15000
  });
  return payload?.data ?? payload;
}

export async function saveAdminAffiliateSettings(body, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/settings`, { method: 'PUT', body, signal });
  memoryCache.delete('affiliate:admin:settings');
  return payload?.data ?? payload;
}

export async function upsertAffiliateRule(body, { id, signal } = {}) {
  const method = id ? 'PATCH' : 'POST';
  const path = id ? `${ADMIN_API_ROOT}/rules/${id}` : `${ADMIN_API_ROOT}/rules`;
  const payload = await request(path, { method, body, signal });
  memoryCache.delete('affiliate:admin:settings');
  return payload?.data ?? payload;
}

export async function deactivateAffiliateRule(id, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/rules/${id}`, { method: 'DELETE', signal });
  memoryCache.delete('affiliate:admin:settings');
  return payload?.data ?? payload;
}

export const affiliateFormatters = {
  currency: (value, currency = 'USD') =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value ?? 0),
  percentage: (value) => new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 2 }).format((value ?? 0) / 100),
  number: (value) => new Intl.NumberFormat().format(value ?? 0)
};
