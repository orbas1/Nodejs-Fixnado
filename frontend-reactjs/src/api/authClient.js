import { PanelApiError } from './panelClient.js';

export async function fetchCurrentUser({ signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });

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
      } catch {
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
