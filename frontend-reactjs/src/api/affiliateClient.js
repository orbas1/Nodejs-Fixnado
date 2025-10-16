const API_ROOT = '/api/affiliate';
const ADMIN_API_ROOT = '/api/admin/affiliate';

const memoryCache = new Map();

function invalidateCache(prefix) {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

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

export async function listAdminAffiliateProfiles({ page, pageSize, status, search, tier, signal, forceRefresh } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (pageSize) params.set('pageSize', pageSize);
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  if (tier) params.set('tier', tier);
  const query = params.toString();
  const path = `${ADMIN_API_ROOT}/profiles${query ? `?${query}` : ''}`;
  const cacheKey = `affiliate:admin:profiles:${query}`;
  const payload = await request(path, {
    signal,
    forceRefresh,
    cacheKey,
    ttl: 5000
  });
  return payload;
}

export async function createAdminAffiliateProfile(body, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/profiles`, { method: 'POST', body, signal });
  invalidateCache('affiliate:admin:profiles:');
  return payload?.data ?? payload;
}

export async function updateAdminAffiliateProfile(id, body, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/profiles/${id}`, { method: 'PATCH', body, signal });
  invalidateCache('affiliate:admin:profiles:');
  return payload?.data ?? payload;
}

export async function listAdminAffiliateLedgerEntries(id, { page, pageSize, signal, forceRefresh } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (pageSize) params.set('pageSize', pageSize);
  const query = params.toString();
  const path = `${ADMIN_API_ROOT}/profiles/${id}/ledger${query ? `?${query}` : ''}`;
  const cacheKey = `affiliate:admin:ledger:${id}:${query}`;
  const payload = await request(path, {
    signal,
    forceRefresh,
    cacheKey,
    ttl: 3000
  });
  return payload;
}

export async function createAdminAffiliateLedgerEntry(id, body, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/profiles/${id}/ledger`, { method: 'POST', body, signal });
  invalidateCache(`affiliate:admin:ledger:${id}:`);
  invalidateCache('affiliate:admin:profiles:');
  return payload;
}

export async function listAdminAffiliateReferrals({
  status,
  search,
  affiliateProfileId,
  page,
  pageSize,
  signal,
  forceRefresh
} = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  if (affiliateProfileId) params.set('affiliateProfileId', affiliateProfileId);
  if (page) params.set('page', page);
  if (pageSize) params.set('pageSize', pageSize);
  const query = params.toString();
  const cacheKey = `affiliate:admin:referrals:${query}`;
  const payload = await request(`${ADMIN_API_ROOT}/referrals${query ? `?${query}` : ''}`, {
    signal,
    forceRefresh,
    cacheKey,
    ttl: 5000
  });
  return payload;
}

export async function createAdminAffiliateReferral(body, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/referrals`, { method: 'POST', body, signal });
  invalidateCache('affiliate:admin:referrals:');
  invalidateCache('affiliate:admin:profiles:');
  return payload;
}

export async function updateAdminAffiliateReferral(id, body, { signal } = {}) {
  const payload = await request(`${ADMIN_API_ROOT}/referrals/${id}`, { method: 'PATCH', body, signal });
  invalidateCache('affiliate:admin:referrals:');
  invalidateCache('affiliate:admin:profiles:');
  return payload;
}

export const affiliateFormatters = {
  currency: (value, currency = 'USD') =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value ?? 0),
  percentage: (value) => new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 2 }).format((value ?? 0) / 100),
  number: (value) => new Intl.NumberFormat().format(value ?? 0)
};
