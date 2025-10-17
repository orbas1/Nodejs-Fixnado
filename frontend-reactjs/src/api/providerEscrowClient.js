import { PanelApiError } from './panelClient.js';

async function toJson(response) {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    console.warn('[providerEscrowClient] Failed to parse JSON response', error);
    return null;
  }
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.set(key, value);
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
}

async function handleResponse(response, fallbackMessage) {
  const payload = await toJson(response);
  if (!response.ok) {
    const message = payload?.message || fallbackMessage || response.statusText || 'Request failed';
    throw new PanelApiError(message, response.status, { details: payload });
  }
  return payload;
}

export async function fetchProviderEscrows(params = {}) {
  const response = await fetch(`/api/provider/escrows${buildQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  return handleResponse(response, 'Unable to load provider escrows');
}

export async function fetchProviderEscrow(id) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/provider/escrows/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const payload = await handleResponse(response, 'Unable to load escrow record');
  return payload?.escrow ?? null;
}

export async function createProviderEscrow(payload) {
  const response = await fetch('/api/provider/escrows', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to create escrow record');
  return body?.escrow ?? null;
}

export async function updateProviderEscrow(id, payload) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/provider/escrows/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to update escrow');
  return body?.escrow ?? null;
}

export async function addProviderEscrowNote(id, { body, pinned } = {}) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/provider/escrows/${id}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, pinned })
  });
  const payload = await handleResponse(response, 'Unable to add note');
  return payload?.escrow ?? null;
}

export async function deleteProviderEscrowNote(id, noteId) {
  if (!id || !noteId) {
    throw new PanelApiError('Escrow id and note id are required', 400);
  }
  const response = await fetch(`/api/provider/escrows/${id}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const payload = await handleResponse(response, 'Unable to delete note');
  return payload?.escrow ?? null;
}

export async function upsertProviderEscrowMilestone(id, milestone, milestoneId) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const hasId = Boolean(milestoneId || milestone?.id);
  const targetId = milestoneId || milestone?.id;
  const endpoint = hasId
    ? `/api/provider/escrows/${id}/milestones/${targetId}`
    : `/api/provider/escrows/${id}/milestones`;
  const method = hasId ? 'PATCH' : 'POST';
  const response = await fetch(endpoint, {
    method,
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(milestone ?? {})
  });
  const payload = await handleResponse(response, 'Unable to save milestone');
  return payload?.escrow ?? null;
}

export async function deleteProviderEscrowMilestone(id, milestoneId) {
  if (!id || !milestoneId) {
    throw new PanelApiError('Escrow id and milestone id are required', 400);
  }
  const response = await fetch(`/api/provider/escrows/${id}/milestones/${milestoneId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const payload = await handleResponse(response, 'Unable to delete milestone');
  return payload?.escrow ?? null;
}

export async function fetchProviderReleasePolicies() {
  const response = await fetch('/api/provider/escrows/policies', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  const payload = await handleResponse(response, 'Unable to load release policies');
  return payload?.policies ?? [];
}

export async function createProviderReleasePolicy(payload) {
  const response = await fetch('/api/provider/escrows/policies', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Unable to create release policy');
}

export async function updateProviderReleasePolicy(id, payload) {
  if (!id) {
    throw new PanelApiError('Policy id is required', 400);
  }
  const response = await fetch(`/api/provider/escrows/policies/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Unable to update release policy');
}

export async function deleteProviderReleasePolicy(id) {
  if (!id) {
    throw new PanelApiError('Policy id is required', 400);
  }
  const response = await fetch(`/api/provider/escrows/policies/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  return handleResponse(response, 'Unable to delete release policy');
}
