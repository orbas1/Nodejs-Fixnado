const FEED_API_ROOT = '/api/feed';
const AUTH_TOKEN_KEY = 'fixnado:accessToken';

function readAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage?.getItem(AUTH_TOKEN_KEY) ?? null;
  } catch (error) {
    console.warn('[feedClient] unable to read auth token', error);
    return null;
  }
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && `${entry}`.trim() !== '') {
          searchParams.append(key, `${entry}`.trim());
        }
      });
      return;
    }

    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
      return;
    }

    const stringValue = `${value}`.trim();
    if (stringValue) {
      searchParams.append(key, stringValue);
    }
  });

  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

function sanitisePayload(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return acc;
      }
      acc[key] = trimmed;
      return acc;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return acc;
      }
      acc[key] = value;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

async function request(path, {
  method = 'GET',
  body,
  signal,
  authenticated = true
} = {}) {
  const headers = new Headers({ Accept: 'application/json' });

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = readAuthToken();
    if (!token) {
      const error = new Error('You must be signed in to access the live feed');
      error.status = 401;
      throw error;
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener(
        'abort',
        () => signal.removeEventListener('abort', abort),
        { once: true }
      );
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
    const networkError = new Error('Unable to reach Fixnado servers. Check your connection and try again.');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[feedClient] unable to parse JSON response', error);
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

export async function fetchLiveFeed(filters = {}, { signal } = {}) {
  const query = buildQuery(sanitisePayload(filters));
  const payload = await request(`${FEED_API_ROOT}/live${query}`, { signal });

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createLiveFeedPost(payload) {
  const body = sanitisePayload(payload);
  return request(`${FEED_API_ROOT}/live`, { method: 'POST', body });
}

export async function submitCustomJobBid(postId, payload) {
  if (!postId) {
    throw new Error('A valid postId is required to submit a bid');
  }
  const body = sanitisePayload(payload);
  return request(`${FEED_API_ROOT}/live/${postId}/bids`, { method: 'POST', body });
}

export async function sendCustomJobBidMessage(postId, bidId, payload) {
  if (!postId || !bidId) {
    throw new Error('postId and bidId are required');
  }
  const body = sanitisePayload(payload);
  return request(`${FEED_API_ROOT}/live/${postId}/bids/${bidId}/messages`, { method: 'POST', body });
}

export async function fetchMarketplaceFeed({ limit } = {}) {
  const query = buildQuery(sanitisePayload({ limit }));
  const payload = await request(`${FEED_API_ROOT}/marketplace${query}`, {
    authenticated: false
  });

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}
