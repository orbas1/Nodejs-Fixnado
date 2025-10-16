const PROFILE_ENDPOINT = '/api/admin/profile';

async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }

  let errorBody = {};
  try {
    errorBody = await response.json();
  } catch {
    // ignore
  }

  const error = new Error(errorBody?.message || 'Unable to process admin profile request');
  error.status = response.status;
  error.details = errorBody?.details;
  throw error;
}

export async function fetchAdminProfile({ signal } = {}) {
  const response = await fetch(PROFILE_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response);
  return payload?.profile ?? payload;
}

export async function saveAdminProfile(profile, { signal } = {}) {
  const response = await fetch(PROFILE_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(profile),
    signal
  });

  const payload = await handleResponse(response);
  return payload?.profile ?? payload;
}
