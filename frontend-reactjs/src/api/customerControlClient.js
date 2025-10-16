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

export function createCustomerDisputeCase(payload, options = {}) {
  return requestJson(`${API_BASE}/disputes`, {
export function createCustomerCoupon(payload, options = {}) {
  return requestJson(`${API_BASE}/coupons`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerDisputeCase(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}`, {
export function updateCustomerCoupon(couponId, payload, options = {}) {
  return requestJson(`${API_BASE}/coupons/${couponId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerDisputeCase(disputeCaseId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}`, {
export async function deleteCustomerCoupon(couponId, options = {}) {
  const response = await fetch(`${API_BASE}/coupons/${couponId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute case');
  return true;
}

export function createCustomerDisputeTask(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerDisputeTask(disputeCaseId, taskId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerDisputeTask(disputeCaseId, taskId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute task');
  return true;
}

export function createCustomerDisputeNote(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerDisputeNote(disputeCaseId, noteId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerDisputeNote(disputeCaseId, noteId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute note');
  return true;
}

export function createCustomerDisputeEvidence(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateCustomerDisputeEvidence(disputeCaseId, evidenceId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/evidence/${evidenceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteCustomerDisputeEvidence(disputeCaseId, evidenceId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}/evidence/${evidenceId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute evidence');
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
  createCustomerDisputeCase,
  updateCustomerDisputeCase,
  deleteCustomerDisputeCase,
  createCustomerDisputeTask,
  updateCustomerDisputeTask,
  deleteCustomerDisputeTask,
  createCustomerDisputeNote,
  updateCustomerDisputeNote,
  deleteCustomerDisputeNote,
  createCustomerDisputeEvidence,
  updateCustomerDisputeEvidence,
  deleteCustomerDisputeEvidence
  createCustomerCoupon,
  updateCustomerCoupon,
  deleteCustomerCoupon
};
