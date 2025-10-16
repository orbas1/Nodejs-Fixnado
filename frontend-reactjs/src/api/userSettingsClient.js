import customerSettingsStub from '../testStubs/customerSettingsStub.js';

const API_BASE = '/api/settings/profile';

const shouldUseFallback = () => {
  const { DEV = false, MODE } = import.meta.env ?? {};
  return Boolean(DEV) && MODE !== 'test';
};

function parseErrorResponse(response, body) {
  const error = new Error(body?.message || 'Unable to load profile settings.');
  error.status = response.status;
  error.details = body?.details ?? [];
  return error;
}

export async function fetchCustomerSettings(options = {}) {
  const { signal, credentials = 'include' } = options ?? {};
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      credentials,
      signal,
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      let body = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }
      throw parseErrorResponse(response, body);
    }

    const payload = await response.json();
    return payload?.data ?? payload;
  } catch (error) {
    if (shouldUseFallback()) {
      console.warn('[userSettingsClient] Falling back to stub data', error);
      return structuredClone(customerSettingsStub);
    }
    throw error;
  }
}

export async function updateCustomerSettings(payload, options = {}) {
  const { signal, credentials = 'include' } = options ?? {};
  try {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      credentials,
      signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload ?? {})
    });

    if (!response.ok) {
      let body = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }
      throw parseErrorResponse(response, body);
    }

    const result = await response.json();
    return result?.data ?? result;
  } catch (error) {
    if (shouldUseFallback()) {
      console.warn('[userSettingsClient] Update failed, retaining stub data', error);
      return structuredClone(customerSettingsStub);
    }
    throw error;
  }
}

export default {
  fetchCustomerSettings,
  updateCustomerSettings
};
