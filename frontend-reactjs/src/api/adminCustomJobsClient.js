const BASE_ENDPOINT = '/api/admin/custom-jobs';

function toQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && `${entry}`.trim() !== '') {
          searchParams.append(key, `${entry}`.trim());
        }
      });
      return;
    }
    searchParams.append(key, `${value}`.trim());
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const error = new Error(payload?.message || fallbackMessage);
  error.status = response.status;
  error.details = payload;
  throw error;
}

function sanitisePayload(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        acc[key] = trimmed;
      }
      return acc;
    }
    if (Array.isArray(value)) {
      acc[key] = value;
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

export async function listCustomJobs(params = {}) {
  const response = await fetch(`${BASE_ENDPOINT}${toQuery(params)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  const payload = await handleResponse(response, 'Unable to load custom jobs');
  return {
    jobs: Array.isArray(payload?.jobs) ? payload.jobs : [],
    summary: payload?.summary ?? {},
    pagination: payload?.pagination ?? { total: 0, limit: 0, offset: 0 }
  };
}

export async function fetchCustomJob(jobId, { signal } = {}) {
  if (!jobId) {
    throw new Error('A jobId is required to fetch custom job details');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${jobId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Unable to load custom job');
}

export async function createCustomJob(payload) {
  const body = sanitisePayload(payload);
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to create custom job');
}

export async function updateCustomJob(jobId, payload) {
  if (!jobId) {
    throw new Error('jobId is required to update custom jobs');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/${jobId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to update custom job');
}

export async function awardCustomJob(jobId, bidId) {
  if (!jobId || !bidId) {
    throw new Error('jobId and bidId are required to award a custom job');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${jobId}/award`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ bidId })
  });
  return handleResponse(response, 'Unable to award custom job');
}

export async function sendAdminBidMessage(jobId, bidId, payload) {
  if (!jobId || !bidId) {
    throw new Error('jobId and bidId are required to send a message');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/${jobId}/bids/${bidId}/messages`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to send bid message');
}

export default {
  listCustomJobs,
  fetchCustomJob,
  createCustomJob,
  updateCustomJob,
  awardCustomJob,
  sendAdminBidMessage
};
