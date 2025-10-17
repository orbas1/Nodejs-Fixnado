const ROOT = '/api/servicemen/tax';

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
    const networkError = new Error('Unable to reach serviceman tax services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[servicemanTaxClient] failed to parse JSON response', error);
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

export function fetchTaxWorkspace(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}${query}`, options);
}

export function updateTaxProfile(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/profile${query}`, { method: 'PUT', body: payload, ...options });
}

export function listTaxFilings(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/filings${query}`, options);
}

export function createTaxFiling(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/filings${query}`, { method: 'POST', body: payload, ...options });
}

export function updateTaxFiling(filingId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/filings/${filingId}${query}`, { method: 'PUT', body: payload, ...options });
}

export function updateTaxFilingStatus(filingId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/filings/${filingId}/status${query}`, { method: 'PATCH', body: payload, ...options });
}

export function deleteTaxFiling(filingId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/filings/${filingId}${query}`, { method: 'DELETE', ...options });
}

export function listTaxTasks(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/tasks${query}`, options);
}

export function createTaxTask(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/tasks${query}`, { method: 'POST', body: payload, ...options });
}

export function updateTaxTask(taskId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/tasks/${taskId}${query}`, { method: 'PUT', body: payload, ...options });
}

export function updateTaxTaskStatus(taskId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/tasks/${taskId}/status${query}`, { method: 'PATCH', body: payload, ...options });
}

export function deleteTaxTask(taskId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/tasks/${taskId}${query}`, { method: 'DELETE', ...options });
}

export function listTaxDocuments(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/documents${query}`, options);
}

export function createTaxDocument(payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/documents${query}`, { method: 'POST', body: payload, ...options });
}

export function updateTaxDocument(documentId, payload, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/documents/${documentId}${query}`, { method: 'PUT', body: payload, ...options });
}

export function deleteTaxDocument(documentId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/documents/${documentId}${query}`, { method: 'DELETE', ...options });
}

export default {
  fetchTaxWorkspace,
  updateTaxProfile,
  listTaxFilings,
  createTaxFiling,
  updateTaxFiling,
  updateTaxFilingStatus,
  deleteTaxFiling,
  listTaxTasks,
  createTaxTask,
  updateTaxTask,
  updateTaxTaskStatus,
  deleteTaxTask,
  listTaxDocuments,
  createTaxDocument,
  updateTaxDocument,
  deleteTaxDocument
};
