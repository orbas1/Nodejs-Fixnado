import { PanelApiError } from './panelClient.js';

async function toJson(response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    console.warn('[adminSessionClient] failed to parse JSON response', error);
    return null;
  }
}

export async function loginAdmin({ email, password, securityToken }) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, securityToken })
    });

    const payload = await toJson(response);

    if (!response.ok) {
      const message = payload?.message || response.statusText || 'Unable to authenticate admin user';
      throw new PanelApiError(message, response.status, { details: payload });
    }

    if (!payload?.token || !payload?.user) {
      throw new PanelApiError('Malformed authentication response', 500);
    }

    return payload;
  } catch (error) {
    if (error instanceof PanelApiError) {
      throw error;
    }

    throw new PanelApiError('Unable to authenticate admin user', 503, { cause: error });
  }
}

export async function revokeAdminSession() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (error) {
    // graceful degradation – logout endpoint optional
    console.info('[adminSessionClient] logout endpoint unavailable', error);
  }
}
