import { PanelApiError } from './panelClient.js';

const API_ROOT = '/api/admin/users';

async function send(path = '', { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  const payload = body && !(body instanceof FormData) ? JSON.stringify(body) : body;
  if (payload && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    body: payload,
    credentials: 'include',
    signal
  });

  let parsed = null;
  if (response.status !== 204) {
    try {
      parsed = await response.json();
    } catch {
      if (response.ok) {
        parsed = null;
      }
    }
  }

  if (!response.ok) {
    const message = parsed?.message || response.statusText || 'Request failed';
    throw new PanelApiError(message, response.status, {
      code: parsed?.code,
      details: parsed?.details
    });
  }

  return parsed;
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.append(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function listAdminUsers({ page, pageSize, search, role, status, signal } = {}) {
  const query = toQuery({ page, pageSize, search, role, status });
  return send(query, { method: 'GET', signal });
}

export function createAdminUser(payload, { signal } = {}) {
  return send('', { method: 'POST', body: payload, signal });
}

export function updateAdminUser(userId, payload, { signal } = {}) {
  return send(`/${encodeURIComponent(userId)}`, { method: 'PATCH', body: payload, signal });
}

export function updateAdminUserProfile(userId, payload, { signal } = {}) {
  return send(`/${encodeURIComponent(userId)}/profile`, { method: 'PATCH', body: payload, signal });
}

export function resetAdminUserMfa(userId, { signal } = {}) {
  return send(`/${encodeURIComponent(userId)}/reset-mfa`, { method: 'POST', signal });
}

export function revokeAdminUserSessions(userId, { signal } = {}) {
  return send(`/${encodeURIComponent(userId)}/revoke-sessions`, { method: 'POST', signal });
}
