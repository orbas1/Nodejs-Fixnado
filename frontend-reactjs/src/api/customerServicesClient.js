const BASE_PATH = '/api/customer/services';

async function handleResponse(response) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  const error = new Error(body?.message || 'Request failed');
  error.status = response.status;
  error.details = body?.errors;
  throw error;
}

export async function fetchCustomerServices(options = {}) {
  const { signal } = options;
  const response = await fetch(BASE_PATH, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response);
}

export async function fetchCustomerOrderDetail(orderId, options = {}) {
  const { signal } = options;
  const response = await fetch(`${BASE_PATH}/orders/${orderId}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response);
}

export async function createCustomerServiceOrder(payload) {
  const response = await fetch(BASE_PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function updateCustomerOrderSchedule(orderId, payload) {
  const response = await fetch(`${BASE_PATH}/orders/${orderId}/schedule`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export async function releaseCustomerEscrow(orderId) {
  const response = await fetch(`${BASE_PATH}/orders/${orderId}/escrow/release`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  return handleResponse(response);
}

export async function startCustomerDispute(orderId, payload) {
  const response = await fetch(`${BASE_PATH}/orders/${orderId}/disputes`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

export default {
  fetchCustomerServices,
  fetchCustomerOrderDetail,
  createCustomerServiceOrder,
  updateCustomerOrderSchedule,
  releaseCustomerEscrow,
  startCustomerDispute
};
