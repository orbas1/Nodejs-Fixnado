const API_BASE = '/api/wallet';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const error = new Error(payload?.message || fallbackMessage || 'Wallet request failed');
  error.status = response.status;
  error.code = payload?.code || payload?.error;
  throw error;
}

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(key, entry));
      return;
    }
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
};

export async function getWalletAccounts(params = {}) {
  const response = await fetch(`${API_BASE}/accounts${toQueryString(params)}`, {
    credentials: 'include'
  });
  const body = await handleResponse(response, 'Unable to load wallet accounts');
  return body?.accounts ?? [];
}

export async function createWalletAccount(payload) {
  const response = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const body = await handleResponse(response, 'Unable to create wallet account');
  return body?.account ?? null;
}

export async function getWalletAccount(accountId, params = {}) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}${toQueryString(params)}`, {
    credentials: 'include'
  });
  return handleResponse(response, 'Unable to load wallet account');
}

export async function updateWalletAccount(accountId, payload) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const body = await handleResponse(response, 'Unable to update wallet account');
  return body?.account ?? null;
}

export async function getWalletTransactions(accountId, params = {}) {
  const response = await fetch(
    `${API_BASE}/accounts/${accountId}/transactions${toQueryString(params)}`,
    { credentials: 'include' }
  );
  return handleResponse(response, 'Unable to load wallet transactions');
}

export async function createWalletTransaction(accountId, payload) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to create wallet transaction');
}

export async function getWalletPaymentMethods(accountId) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}/payment-methods`, {
    credentials: 'include'
  });
  const body = await handleResponse(response, 'Unable to load payment methods');
  return body?.methods ?? [];
}

export async function createWalletPaymentMethod(accountId, payload) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}/payment-methods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const body = await handleResponse(response, 'Unable to create payment method');
  return body?.method ?? null;
}

export async function updateWalletPaymentMethod(accountId, methodId, payload) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}/payment-methods/${methodId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const body = await handleResponse(response, 'Unable to update payment method');
  return body?.method ?? null;
}

export async function getWalletSummary(params = {}) {
  const response = await fetch(`${API_BASE}/summary${toQueryString(params)}`, {
    credentials: 'include'
  });
  const body = await handleResponse(response, 'Unable to load wallet summary');
  return body?.overview ?? null;
}

export async function deleteWalletPaymentMethod(accountId, methodId) {
  const response = await fetch(`${API_BASE}/accounts/${accountId}/payment-methods/${methodId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) {
    await handleResponse(response, 'Unable to remove payment method');
  }
  return true;
}

export async function exportWalletTransactions(accountId, params = {}) {
  const response = await fetch(
    `${API_BASE}/accounts/${accountId}/transactions/export${toQueryString(params)}`,
    {
      credentials: 'include'
    }
  );
  if (!response.ok) {
    await handleResponse(response, 'Unable to export wallet transactions');
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch ? filenameMatch[1] : `wallet-${accountId}-transactions.csv`;
  const blob = await response.blob();
  return { filename, blob };
}

export default {
  getWalletAccounts,
  createWalletAccount,
  getWalletAccount,
  updateWalletAccount,
  getWalletTransactions,
  createWalletTransaction,
  getWalletPaymentMethods,
  createWalletPaymentMethod,
  updateWalletPaymentMethod,
  deleteWalletPaymentMethod,
  exportWalletTransactions,
  getWalletSummary
};
