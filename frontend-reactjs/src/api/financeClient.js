const API_ROOT = '/api/finance';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return {};
    }
    return response.json();
  }

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  const error = new Error(body?.message || fallbackMessage);
  error.status = response.status;
  error.code = body?.code;
  throw error;
}

export async function fetchFinanceOverview(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = new Headers({ Accept: 'application/json' });
  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  const response = await fetch(`${API_ROOT}/overview${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });

  return handleResponse(response, 'Unable to load finance overview');
}

export async function fetchOrderFinanceTimeline(orderId, options = {}) {
  if (!orderId) {
    throw new Error('orderId is required to fetch finance timeline');
  }

  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = new Headers({ Accept: 'application/json' });
  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  const response = await fetch(`${API_ROOT}/orders/${orderId}/timeline`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });

  return handleResponse(response, 'Unable to load finance timeline');
}

export async function createCheckoutSession(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Checkout payload must be an object');
  }

  const { headers: extraHeaders, credentials = 'include', signal } = options;
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  const response = await fetch(`${API_ROOT}/checkout`, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });

  return handleResponse(response, 'Failed to initiate checkout session');
}

export default {
  fetchFinanceOverview,
  fetchOrderFinanceTimeline,
  createCheckoutSession
};
