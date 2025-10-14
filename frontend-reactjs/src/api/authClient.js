import { PanelApiError } from './panelClient.js';

function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage?.getItem('fixnado:accessToken') ?? null;
  } catch (error) {
    console.warn('[authClient] unable to read auth token', error);
    return null;
  }
}

export async function fetchCurrentUser({ signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers,
      credentials: 'include',
      signal
    });

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (error) {
        // ignore JSON parsing issues
      }
      const message = errorBody?.message || response.statusText || 'Unable to verify session';
      throw new PanelApiError(message, response.status, { cause: errorBody });
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while verifying session', 503, { cause: error });
  }
}
