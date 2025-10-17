import servicemanProfileSettingsStub from '../testStubs/servicemanProfileSettingsStub.js';

const API_BASE = '/api/servicemen/settings/profile';

const shouldUseFallback = () => {
  const { DEV = false, MODE } = import.meta.env ?? {};
  return Boolean(DEV) && MODE !== 'test';
};

function parseErrorResponse(response, body) {
  const error = new Error(body?.message || 'Unable to load serviceman profile settings.');
  error.status = response.status;
  error.details = body?.details ?? [];
  return error;
}

export async function fetchServicemanProfileSettings(options = {}) {
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
    return payload?.data ?? payload ?? null;
  } catch (error) {
    if (shouldUseFallback()) {
      console.warn('[servicemanProfileClient] Falling back to stub data', error);
      return structuredClone(servicemanProfileSettingsStub);
    }
    throw error;
  }
}

export async function updateServicemanProfileSettings(payload, options = {}) {
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
    return result?.data ?? result ?? null;
  } catch (error) {
    if (shouldUseFallback()) {
      console.warn('[servicemanProfileClient] Update failed, retaining stub data', error);
      return structuredClone(servicemanProfileSettingsStub);
    }
    throw error;
  }
}

export default {
  fetchServicemanProfileSettings,
  updateServicemanProfileSettings
};
