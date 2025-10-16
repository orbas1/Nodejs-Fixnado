const API_BASE = '/api/customer-control';

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

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  await ensureResponseOk(response, 'Request failed');
  return response.json();
}

export async function fetchCustomerOverview(options = {}) {
  const response = await fetch(`${API_BASE}/overview`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
    signal: options.signal
  });

  await ensureResponseOk(response, 'Failed to load customer overview');
  return response.json();
}

export function saveCustomerProfile(payload, options = {}) {
  return requestJson(`${API_BASE}/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function createCustomerContact(payload, options = {}) {
  return requestJson(`${API_BASE}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerContact(contactId, payload, options = {}) {
  return requestJson(`${API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerContact(contactId, options = {}) {
  const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete contact');
  return true;
}

export function createCustomerLocation(payload, options = {}) {
  return requestJson(`${API_BASE}/locations`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerLocation(locationId, payload, options = {}) {
  return requestJson(`${API_BASE}/locations/${locationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerLocation(locationId, options = {}) {
  const response = await fetch(`${API_BASE}/locations/${locationId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete location');
  return true;
}

export function createCustomerCoupon(payload, options = {}) {
  return requestJson(`${API_BASE}/coupons`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerCoupon(couponId, payload, options = {}) {
  return requestJson(`${API_BASE}/coupons/${couponId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerCoupon(couponId, options = {}) {
  const response = await fetch(`${API_BASE}/coupons/${couponId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete coupon');
  return true;
}

export default {
  fetchCustomerOverview,
  saveCustomerProfile,
  createCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  createCustomerLocation,
  updateCustomerLocation,
  deleteCustomerLocation,
  createCustomerCoupon,
  updateCustomerCoupon,
  deleteCustomerCoupon
};
