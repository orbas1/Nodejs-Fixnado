const BASE_PATH = '/api/account-support/tasks';

const defaultHeaders = { 'Content-Type': 'application/json' };

function buildQuery(params = {}) {
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

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }
  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  const error = new Error(body?.message || fallbackMessage);
  error.status = response.status;
  throw error;
}

export async function listAccountSupportTasks(params = {}) {
  const response = await fetch(`${BASE_PATH}${buildQuery(params)}`, {
    credentials: 'include'
  });
  return handleResponse(response, 'Failed to load account support tasks');
}

export async function createAccountSupportTask(payload = {}) {
  const response = await fetch(BASE_PATH, {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create support task');
}

export async function updateAccountSupportTask(taskId, updates = {}) {
  if (!taskId) {
    throw new Error('taskId is required');
  }
  const response = await fetch(`${BASE_PATH}/${taskId}`, {
    method: 'PATCH',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(updates)
  });
  return handleResponse(response, 'Failed to update support task');
}

export async function appendAccountSupportTaskUpdate(taskId, payload = {}) {
  if (!taskId) {
    throw new Error('taskId is required');
  }
  const response = await fetch(`${BASE_PATH}/${taskId}/activity`, {
    method: 'POST',
    headers: defaultHeaders,
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to record task update');
}

export default {
  listAccountSupportTasks,
  createAccountSupportTask,
  updateAccountSupportTask,
  appendAccountSupportTaskUpdate
};
