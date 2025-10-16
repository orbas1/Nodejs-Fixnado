const BASE_ENDPOINT = '/api/admin/live-feed/audits';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.status === 204 ? null : response.json();
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const error = new Error(payload?.message || fallbackMessage);
  error.status = response.status;
  error.details = payload?.errors || payload?.details;
  throw error;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== '') {
          query.append(key, entry);
        }
      });
      return;
    }
    query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function listAdminLiveFeedAudits(params = {}, { signal } = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${BASE_ENDPOINT}${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Failed to load live feed audit events');
}

export async function getAdminLiveFeedAudit(auditId, { signal, includeNotes = true } = {}) {
  const query = includeNotes ? '' : '?includeNotes=false';
  const response = await fetch(`${BASE_ENDPOINT}/${auditId}${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Failed to load live feed audit event');
}

export async function createAdminLiveFeedAudit(payload) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create live feed audit event');
}

export async function updateAdminLiveFeedAudit(auditId, payload) {
  const response = await fetch(`${BASE_ENDPOINT}/${auditId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update live feed audit event');
}

export async function createAdminLiveFeedAuditNote(auditId, payload) {
  const response = await fetch(`${BASE_ENDPOINT}/${auditId}/notes`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create audit note');
}

export async function updateAdminLiveFeedAuditNote(noteId, payload) {
  const response = await fetch(`${BASE_ENDPOINT}/notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update audit note');
}

export async function deleteAdminLiveFeedAuditNote(noteId) {
  const response = await fetch(`${BASE_ENDPOINT}/notes/${noteId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  await handleResponse(response, 'Failed to delete audit note');
  return true;
}
