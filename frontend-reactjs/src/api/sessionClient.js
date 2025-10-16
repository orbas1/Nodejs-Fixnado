import { PanelApiError } from './panelClient.js';
import { loginOfflineUser, registerOfflineUser, getOfflineProfile } from './offlineSession.js';

async function parseJson(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    console.warn('[sessionClient] failed to parse JSON response', error);
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

export async function loginUser({ email, password, rememberMe = false }) {
  try {
    const response = await fetch('/api/auth/login', buildRequestOptions('POST', { email, password, rememberMe }));
    const payload = await parseJson(response);

    if (!response.ok) {
      throw handleErrorResponse(response, payload, 'Unable to authenticate');
    }

    if (!payload?.user || !payload?.session) {
      throw new PanelApiError('Malformed authentication response', 500, { details: payload });
    }

    return payload;
  } catch (error) {
    if (isNetworkFailure(error)) {
      const offline = await loginOfflineUser({ email, password }, { force: true });
      if (offline) {
        return offline;
      }
    }
    throw error;
  }
}

export async function registerUser(payload) {
  try {
    const response = await fetch('/api/auth/register', buildRequestOptions('POST', payload));
    const body = await parseJson(response);

    if (!response.ok) {
      throw handleErrorResponse(response, body, 'Registration failed');
    }

    return body;
  } catch (error) {
    if (isNetworkFailure(error)) {
      const offline = await registerOfflineUser(payload, { force: true });
      if (offline) {
        return offline;
      }
    }
    throw error;
  }
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
      const persona = getOfflineProfile(undefined, { force: true });
      if (persona) {
        return persona;
      }
    }
    throw error;
  }
}

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', buildRequestOptions('POST'));
  } catch (error) {
    console.info('[sessionClient] logout request failed', error);
  }
}

export default {
  loginUser,
  registerUser,
  fetchProfile,
  logoutUser
};
