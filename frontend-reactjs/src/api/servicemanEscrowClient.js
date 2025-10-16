import { PanelApiError } from './panelClient.js';

async function toJson(response) {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    console.warn('[servicemanEscrowClient] Failed to parse JSON response', error);
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
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function handleResponse(response, defaultMessage) {
  const payload = await toJson(response);
  if (!response.ok) {
    const message = payload?.message || defaultMessage || response.statusText || 'Request failed';
    throw new PanelApiError(message, response.status, { details: payload });
  }
  return payload;
}

export async function fetchServicemanEscrows(params = {}) {
  const response = await fetch(`/api/serviceman/escrows${buildQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  return handleResponse(response, 'Unable to load escrows');
}

export async function fetchServicemanEscrow(id) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await handleResponse(response, 'Unable to load escrow record');
  return payload?.escrow ?? null;
}

export async function updateServicemanEscrow(id, payload) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to update escrow');
  return body?.escrow ?? null;
}

export async function createServicemanEscrowNote(id, { body, pinned } = {}) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}/notes`, {
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

export async function deleteServicemanEscrowNote(id, noteId) {
  if (!id || !noteId) {
    throw new PanelApiError('Escrow id and note id are required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await handleResponse(response, 'Unable to delete escrow note');
  return payload?.escrow ?? null;
}

export async function upsertServicemanEscrowMilestone(id, milestoneId, payload) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const hasId = Boolean(milestoneId);
  const endpoint = hasId
    ? `/api/serviceman/escrows/${id}/milestones/${milestoneId}`
    : `/api/serviceman/escrows/${id}/milestones`;
  const method = hasId ? 'PATCH' : 'POST';
  const response = await fetch(endpoint, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to save milestone');
  return body?.escrow ?? null;
}

export async function deleteServicemanEscrowMilestone(id, milestoneId) {
  if (!id || !milestoneId) {
    throw new PanelApiError('Escrow id and milestone id are required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}/milestones/${milestoneId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const body = await handleResponse(response, 'Unable to delete milestone');
  return body?.escrow ?? null;
}

export async function createServicemanWorkLog(id, payload) {
  if (!id) {
    throw new PanelApiError('Escrow id is required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}/work-logs`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to add work log');
  return body?.escrow ?? null;
}

export async function updateServicemanWorkLog(id, workLogId, payload) {
  if (!id || !workLogId) {
    throw new PanelApiError('Escrow id and work log id are required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}/work-logs/${workLogId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  const body = await handleResponse(response, 'Unable to update work log');
  return body?.escrow ?? null;
}

export async function deleteServicemanWorkLog(id, workLogId) {
  if (!id || !workLogId) {
    throw new PanelApiError('Escrow id and work log id are required', 400);
  }
  const response = await fetch(`/api/serviceman/escrows/${id}/work-logs/${workLogId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });
  const body = await handleResponse(response, 'Unable to delete work log');
  return body?.escrow ?? null;
}

export default {
  fetchServicemanEscrows,
  fetchServicemanEscrow,
  updateServicemanEscrow,
  createServicemanEscrowNote,
  deleteServicemanEscrowNote,
  upsertServicemanEscrowMilestone,
  deleteServicemanEscrowMilestone,
  createServicemanWorkLog,
  updateServicemanWorkLog,
  deleteServicemanWorkLog
};
