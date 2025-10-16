const API_ROOT = '/api/admin/wallets';

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

function buildHeaders(extraHeaders, hasBody = false) {
  const headers = new Headers({ Accept: 'application/json' });
  if (hasBody) {
    headers.set('Content-Type', 'application/json');
  }
  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }
  return headers;
}

export async function fetchWalletOverview(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders);
  const response = await fetch(`${API_ROOT}/overview${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load wallet overview');
}

export async function fetchWalletAccounts(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders);
  const response = await fetch(`${API_ROOT}/accounts${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load wallet accounts');
}

export async function fetchWalletTransactions(accountId, params = {}, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required to fetch wallet transactions');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders);
  const response = await fetch(
    `${API_ROOT}/accounts/${accountId}/transactions${buildQuery(params)}`,
    {
      method: 'GET',
      headers,
      credentials,
      signal
    }
  );
  return handleResponse(response, 'Unable to load wallet transactions');
}

export async function saveWalletSettings(payload, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, true);
  const response = await fetch(`${API_ROOT}/settings`, {
    method: 'PUT',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Unable to save wallet settings');
}

export async function createWalletAccount(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to create a wallet account');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, true);
  const response = await fetch(`${API_ROOT}/accounts`, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to create wallet account');
}

export async function updateWalletAccount(accountId, payload, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required to update a wallet account');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, true);
  const response = await fetch(`${API_ROOT}/accounts/${accountId}`, {
    method: 'PATCH',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Unable to update wallet account');
}

export async function recordWalletTransaction(accountId, payload, options = {}) {
  if (!accountId) {
    throw new Error('accountId is required to record a wallet transaction');
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to record a wallet transaction');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, true);
  const response = await fetch(`${API_ROOT}/accounts/${accountId}/transactions`, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to record wallet transaction');
}

export default {
  fetchWalletOverview,
  fetchWalletAccounts,
  fetchWalletTransactions,
  saveWalletSettings,
  createWalletAccount,
  updateWalletAccount,
  recordWalletTransaction
};
