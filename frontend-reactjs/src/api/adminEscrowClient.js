import { PanelApiError } from './panelClient.js';

async function toJson(response) {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    console.warn('[adminEscrowClient] Failed to parse JSON response', error);
    return null;
  }
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

async function handleResponse(response, defaultMessage) {
  const payload = await toJson(response);
  if (!response.ok) {
    const message = payload?.message || defaultMessage || response.statusText || 'Request failed';
    throw new PanelApiError(message, response.status, { details: payload });
  }
  return payload;
}

export async function fetchEscrows(params = {}) {
  const response = await fetch(`/api/admin/escrows${buildQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  return handleResponse(response, 'Unable to load escrow records');
}

export async function fetchEscrow(id) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/admin/escrows/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await handleResponse(response, 'Unable to load escrow record');
  return payload?.escrow ?? null;
}

export async function createEscrow(payload) {
  const response = await fetch('/api/admin/escrows', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to create escrow record');
  return body?.escrow ?? null;
}

export async function updateEscrowRecord(id, payload) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/admin/escrows/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to update escrow record');
  return body?.escrow ?? null;
}

export async function addEscrowNoteRecord(id, { body, pinned } = {}) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/admin/escrows/${id}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ body, pinned })
  });
  const payload = await handleResponse(response, 'Unable to add escrow note');
  return payload?.escrow ?? null;
}

export async function deleteEscrowNoteRecord(id, noteId) {
  if (!id || !noteId) {
    throw new PanelApiError('Escrow id and note id are required', 400);
  }
  const response = await fetch(`/api/admin/escrows/${id}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await handleResponse(response, 'Unable to delete escrow note');
  return payload?.escrow ?? null;
}

export async function upsertEscrowMilestoneRecord(id, milestone, milestoneId) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const hasId = Boolean(milestoneId);
  const endpoint = hasId ? `/api/admin/escrows/${id}/milestones/${milestoneId}` : `/api/admin/escrows/${id}/milestones`;
  const method = hasId ? 'PATCH' : 'POST';
  const response = await fetch(endpoint, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(milestone ?? {})
  });
  const payload = await handleResponse(response, 'Unable to update escrow milestone');
  return payload?.escrow ?? null;
}

export async function deleteEscrowMilestoneRecord(id, milestoneId) {
  if (!id || !milestoneId) {
    throw new PanelApiError('Escrow id and milestone id are required', 400);
  }
  const response = await fetch(`/api/admin/escrows/${id}/milestones/${milestoneId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await handleResponse(response, 'Unable to delete escrow milestone');
  return payload?.escrow ?? null;
}

export async function fetchReleasePolicies() {
  const response = await fetch('/api/admin/escrows/policies', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await handleResponse(response, 'Unable to load release policies');
  return payload?.policies ?? [];
}

export async function createReleasePolicyRecord(payload) {
  const response = await fetch('/api/admin/escrows/policies', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Unable to create release policy');
}

export async function updateReleasePolicyRecord(id, payload) {
  if (!id) {
    throw new PanelApiError('Policy id is required', 400);
  }
  const response = await fetch(`/api/admin/escrows/policies/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Unable to update release policy');
}

export async function deleteReleasePolicyRecord(id) {
  if (!id) {
    throw new PanelApiError('Policy id is required', 400);
  }
  const response = await fetch(`/api/admin/escrows/policies/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  return handleResponse(response, 'Unable to delete release policy');
}
