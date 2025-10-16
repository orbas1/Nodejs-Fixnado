import { PanelApiError } from './panelClient.js';
import { getOfflineProfile } from './offlineSession.js';

async function parseJson(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    console.warn('[profileClient] failed to parse JSON response', error);
    return null;
  }
}

function buildRequestOptions(method = 'GET', body) {
  const options = {
    method,
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include'
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  return options;
}

function handleErrorResponse(response, payload, fallbackMessage) {
  const message = payload?.message || payload?.error || response.statusText || fallbackMessage;
  return new PanelApiError(message, response.status, { details: payload });
}

function isNetworkFailure(error) {
  if (!error) {
    return false;
  }

  if (error instanceof PanelApiError) {
    return [0, 404, 500, 501, 503].includes(error.status);
  }

  return error?.name === 'TypeError';
}

export async function fetchProfile() {
  try {
    const response = await fetch('/api/auth/me', buildRequestOptions('GET'));
    const payload = await parseJson(response);

    if (!response.ok) {
      throw handleErrorResponse(response, payload, 'Unable to fetch profile');
    }

    return payload;
  } catch (error) {
    if (isNetworkFailure(error)) {
      const offline = getOfflineProfile(undefined, { force: true });
      if (offline) {
        return offline;
      }
    }
    throw error;
  }
}

export async function updateProfile(payload) {
  try {
    const response = await fetch('/api/auth/me', buildRequestOptions('PUT', payload));
    const body = await parseJson(response);

    if (!response.ok) {
      throw handleErrorResponse(response, body, 'Unable to update profile');
    }

    return body;
  } catch (error) {
    if (isNetworkFailure(error)) {
      console.warn('[profileClient] falling back to offline profile update', error);
      const offline = getOfflineProfile(undefined, { force: true });
      if (offline) {
        return { ...offline, ...payload };
      }
    }
    throw error;
  }
}

export default {
  fetchProfile,
  updateProfile
};
