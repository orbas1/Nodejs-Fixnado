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

export async function fetchFinanceReport(params = {}, options = {}) {
  const format = params?.format ?? 'json';
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = new Headers({
    Accept: format === 'csv' ? 'text/csv' : 'application/json'
  });

  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  const response = await fetch(`${API_ROOT}/reports/daily${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });

  if (format === 'csv') {
    if (!response.ok) {
      let message = 'Unable to download finance report';
      try {
        const body = await response.json();
        message = body?.message || message;
      } catch {
        // ignore JSON parsing failure
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return response.text();
  }

  return handleResponse(response, 'Unable to load finance report');
}

export async function fetchFinanceAlerts(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = new Headers({ Accept: 'application/json' });

  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }

  const response = await fetch(`${API_ROOT}/alerts${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });

  return handleResponse(response, 'Unable to load finance alerts');
}

export default {
  fetchFinanceOverview,
  fetchOrderFinanceTimeline,
  createCheckoutSession,
  fetchFinanceReport,
  fetchFinanceAlerts
};
