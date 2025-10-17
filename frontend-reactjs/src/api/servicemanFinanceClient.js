const ROOT = '/api/servicemen/finance';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function request(path, { method = 'GET', body, signal, headers: extraHeaders } = {}) {
  const headers = new Headers({ Accept: 'application/json' });

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (extraHeaders) {
    const entries = extraHeaders instanceof Headers ? extraHeaders.entries() : Object.entries(extraHeaders);
    for (const [key, value] of entries) {
      headers.set(key, value);
    }
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
    const networkError = new Error('Unable to reach serviceman finance services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[servicemanFinanceClient] failed to parse JSON response', error);
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

export function fetchFinanceWorkspace(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}${query}`, options);
}

export function updateFinanceProfile(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/profile${query}`, { method: 'PUT', body: payload, ...options });
}

export function listFinanceEarnings(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/earnings${query}`, options);
}

export function createFinanceEarning(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/earnings${query}`, { method: 'POST', body: payload, ...options });
}

export function updateFinanceEarning(earningId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/earnings/${earningId}${query}`, { method: 'PUT', body: payload, ...options });
}

export function updateFinanceEarningStatus(earningId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/earnings/${earningId}/status${query}`, { method: 'PATCH', body: payload, ...options });
}

export function listFinanceExpenses(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/expenses${query}`, options);
}

export function createFinanceExpense(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/expenses${query}`, { method: 'POST', body: payload, ...options });
}

export function updateFinanceExpense(expenseId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/expenses/${expenseId}${query}`, { method: 'PUT', body: payload, ...options });
}

export function updateFinanceExpenseStatus(expenseId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/expenses/${expenseId}/status${query}`, { method: 'PATCH', body: payload, ...options });
}

export function listFinanceAllowances(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/allowances${query}`, options);
}

export function upsertFinanceAllowance(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  if (payload?.id) {
    return request(`${ROOT}/allowances/${payload.id}${query}`, { method: 'PUT', body: payload, ...options });
  }
  return request(`${ROOT}/allowances${query}`, { method: 'POST', body: payload, ...options });
}

export function deleteFinanceAllowance(allowanceId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/allowances/${allowanceId}${query}`, { method: 'DELETE', ...options });
}

export default {
  fetchFinanceWorkspace,
  updateFinanceProfile,
  listFinanceEarnings,
  createFinanceEarning,
  updateFinanceEarning,
  updateFinanceEarningStatus,
  listFinanceExpenses,
  createFinanceExpense,
  updateFinanceExpense,
  updateFinanceExpenseStatus,
  listFinanceAllowances,
  upsertFinanceAllowance,
  deleteFinanceAllowance
};
