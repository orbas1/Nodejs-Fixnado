const API_BASE = '/api/serviceman-control';

function ensureResponseOk(response, defaultMessage) {
  if (response.ok) {
    return response;
  }

  const error = new Error(defaultMessage);
  error.status = response.status;
  return response
    .json()
    .catch(() => ({}))
    .then((body) => {
      if (body?.message) {
        error.message = body.message;
      }
      error.body = body;
      throw error;
    });
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  await ensureResponseOk(response, 'Request failed');
  return response.json();
}

export async function fetchServicemanDisputes(options = {}) {
  const response = await fetch(`${API_BASE}/disputes`, {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.headers ?? {}) },
    signal: options.signal
  });

  await ensureResponseOk(response, 'Failed to load serviceman dispute workspace');
  return response.json();
}

export function createServicemanDisputeCase(payload, options = {}) {
  return requestJson(`${API_BASE}/disputes`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateServicemanDisputeCase(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteServicemanDisputeCase(disputeCaseId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute case');
  return true;
}

export function createServicemanDisputeTask(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateServicemanDisputeTask(disputeCaseId, taskId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteServicemanDisputeTask(disputeCaseId, taskId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}/tasks/${taskId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute task');
  return true;
}

export function createServicemanDisputeNote(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateServicemanDisputeNote(disputeCaseId, noteId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteServicemanDisputeNote(disputeCaseId, noteId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute note');
  return true;
}

export function createServicemanDisputeEvidence(disputeCaseId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export function updateServicemanDisputeEvidence(disputeCaseId, evidenceId, payload, options = {}) {
  return requestJson(`${API_BASE}/disputes/${disputeCaseId}/evidence/${evidenceId}`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
    ...options
  });
}

export async function deleteServicemanDisputeEvidence(disputeCaseId, evidenceId, options = {}) {
  const response = await fetch(`${API_BASE}/disputes/${disputeCaseId}/evidence/${evidenceId}`, {
    method: 'DELETE',
    credentials: 'include',
    ...(options ?? {})
  });
  await ensureResponseOk(response, 'Failed to delete dispute evidence');
  return true;
}

export default {
  fetchServicemanDisputes,
  createServicemanDisputeCase,
  updateServicemanDisputeCase,
  deleteServicemanDisputeCase,
  createServicemanDisputeTask,
  updateServicemanDisputeTask,
  deleteServicemanDisputeTask,
  createServicemanDisputeNote,
  updateServicemanDisputeNote,
  deleteServicemanDisputeNote,
  createServicemanDisputeEvidence,
  updateServicemanDisputeEvidence,
  deleteServicemanDisputeEvidence
};

