const BASE_URL = '/api/account/settings';

async function request(path, { method = 'GET', body, signal } = {}) {
  const options = {
    method,
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include',
    signal
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Failed to process account settings request');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function fetchAccountSettings(options) {
  return request('', { method: 'GET', ...(options ?? {}) });
}

export function updateAccountProfile(body, options) {
  return request('/profile', { method: 'PUT', body, ...(options ?? {}) });
}

export function updateAccountPreferences(body, options) {
  return request('/preferences', { method: 'PUT', body, ...(options ?? {}) });
}

export function updateAccountSecurity(body, options) {
  return request('/security', { method: 'PUT', body, ...(options ?? {}) });
}

export function createNotificationRecipient(body, options) {
  return request('/recipients', { method: 'POST', body, ...(options ?? {}) });
}

export function updateNotificationRecipient(recipientId, body, options) {
  if (!recipientId) {
    throw new Error('recipientId is required');
  }
  return request(`/recipients/${recipientId}`, { method: 'PATCH', body, ...(options ?? {}) });
}

export function deleteNotificationRecipient(recipientId, options) {
  if (!recipientId) {
    throw new Error('recipientId is required');
  }
  return request(`/recipients/${recipientId}`, { method: 'DELETE', ...(options ?? {}) });
}

export default {
  fetchAccountSettings,
  updateAccountProfile,
  updateAccountPreferences,
  updateAccountSecurity,
  createNotificationRecipient,
  updateNotificationRecipient,
  deleteNotificationRecipient
};
