const API_BASE = '/api/servicemen';

function ensureResponseOk(response, defaultMessage) {
  if (response.ok) {
    return response;
  }

  const error = new Error(defaultMessage);
  error.status = response.status;
  return response
    .json()
    .catch(() => ({}))
    .then((body) => {
      if (body?.message) {
        error.message = body.message;
      }
      error.body = body;
      throw error;
    });
}

async function requestJson(path, { method = 'GET', body, signal, headers } = {}) {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(headers ?? {})
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  await ensureResponseOk(response, 'Request failed');
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function fetchServicemanIdentity(servicemanId, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity`, {
    method: 'GET',
    signal: options.signal,
    headers: options.headers
  });
}

export function updateServicemanIdentity(servicemanId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity`, {
    method: 'PUT',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export function createIdentityDocument(servicemanId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/documents`, {
    method: 'POST',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export function updateIdentityDocument(servicemanId, documentId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/documents/${documentId}`, {
    method: 'PUT',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export async function deleteIdentityDocument(servicemanId, documentId, options = {}) {
  const response = await fetch(`${API_BASE}/${servicemanId}/identity/documents/${documentId}`, {
    method: 'DELETE',
    credentials: 'include',
    signal: options.signal,
    headers: options.headers
  });
  await ensureResponseOk(response, 'Failed to delete identity document');
  return response.json();
}

export function createIdentityCheck(servicemanId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/checks`, {
    method: 'POST',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export function updateIdentityCheck(servicemanId, checkId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/checks/${checkId}`, {
    method: 'PUT',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export async function deleteIdentityCheck(servicemanId, checkId, options = {}) {
  const response = await fetch(`${API_BASE}/${servicemanId}/identity/checks/${checkId}`, {
    method: 'DELETE',
    credentials: 'include',
    signal: options.signal,
    headers: options.headers
  });
  await ensureResponseOk(response, 'Failed to delete identity check');
  return response.json();
}

export function addIdentityWatcher(servicemanId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/watchers`, {
    method: 'POST',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export function updateIdentityWatcher(servicemanId, watcherId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/watchers/${watcherId}`, {
    method: 'PUT',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export async function removeIdentityWatcher(servicemanId, watcherId, options = {}) {
  const response = await fetch(`${API_BASE}/${servicemanId}/identity/watchers/${watcherId}`, {
    method: 'DELETE',
    credentials: 'include',
    signal: options.signal,
    headers: options.headers
  });
  await ensureResponseOk(response, 'Failed to remove identity watcher');
  return response.json();
}

export function createIdentityEvent(servicemanId, payload, options = {}) {
  return requestJson(`${API_BASE}/${servicemanId}/identity/events`, {
    method: 'POST',
    body: payload,
    signal: options.signal,
    headers: options.headers
  });
}

export default {
  fetchServicemanIdentity,
  updateServicemanIdentity,
  createIdentityDocument,
  updateIdentityDocument,
  deleteIdentityDocument,
  createIdentityCheck,
  updateIdentityCheck,
  deleteIdentityCheck,
  addIdentityWatcher,
  updateIdentityWatcher,
  removeIdentityWatcher,
  createIdentityEvent
};
