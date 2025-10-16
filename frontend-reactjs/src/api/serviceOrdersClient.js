const API_ROOT = '/api/service-orders';

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

function buildHeaders(extraHeaders, { acceptsJson = true, contentJson = false } = {}) {
  const headers = new Headers();
  if (acceptsJson) {
    headers.set('Accept', 'application/json');
  }
  if (contentJson) {
    headers.set('Content-Type', 'application/json');
  }
  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }
  return headers;
}

export async function listServiceOrders(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true });
  const response = await fetch(`${API_ROOT}${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load service orders');
}

export async function getServiceOrder(orderId, options = {}) {
  if (!orderId) {
    throw new Error('orderId is required to retrieve a service order');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true });
  const response = await fetch(`${API_ROOT}/${orderId}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load service order');
}

export async function createServiceOrder(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to create a service order');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true, contentJson: true });
  const response = await fetch(API_ROOT, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to create service order');
}

export async function updateServiceOrder(orderId, payload, options = {}) {
  if (!orderId) {
    throw new Error('orderId is required to update a service order');
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to update a service order');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true, contentJson: true });
  const response = await fetch(`${API_ROOT}/${orderId}`, {
    method: 'PUT',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to update service order');
}

export async function updateServiceOrderStatus(orderId, status, options = {}) {
  if (!orderId) {
    throw new Error('orderId is required to update status');
  }
  if (!status) {
    throw new Error('status is required to update service order status');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true, contentJson: true });
  const response = await fetch(`${API_ROOT}/${orderId}/status`, {
    method: 'PATCH',
    headers,
    credentials,
    signal,
    body: JSON.stringify({ status })
  });
  return handleResponse(response, 'Unable to update service order status');
}

export async function addServiceOrderNote(orderId, payload, options = {}) {
  if (!orderId) {
    throw new Error('orderId is required to add a note');
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required to add a note');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true, contentJson: true });
  const response = await fetch(`${API_ROOT}/${orderId}/notes`, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to add note');
}

export async function deleteServiceOrderNote(orderId, noteId, options = {}) {
  if (!orderId || !noteId) {
    throw new Error('orderId and noteId are required to delete a note');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders(extraHeaders, { acceptsJson: true });
  const response = await fetch(`${API_ROOT}/${orderId}/notes/${noteId}`, {
    method: 'DELETE',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to delete note');
}

export default {
  listServiceOrders,
  getServiceOrder,
  createServiceOrder,
  updateServiceOrder,
  updateServiceOrderStatus,
  addServiceOrderNote,
  deleteServiceOrderNote
};
