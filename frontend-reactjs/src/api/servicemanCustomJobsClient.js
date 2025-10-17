const ROOT = '/api/serviceman/custom-jobs';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        searchParams.append(key, trimmed);
      }
      return;
    }

    if (typeof value === 'number') {
      searchParams.append(key, String(value));
      return;
    }

    if (value instanceof Date) {
      searchParams.append(key, value.toISOString());
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry != null && `${entry}`.trim()) {
          searchParams.append(key, `${entry}`.trim());
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[servicemanCustomJobsClient] Unable to parse response JSON', error);
    }
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

function sanitisePayload(payload = {}) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return acc;
      }
      acc[key] = trimmed;
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

export async function listServicemanCustomJobs(params = {}, options = {}) {
  const query = buildQuery(sanitisePayload(params));
  return request(`${ROOT}${query}`, options);
}

export async function getServicemanCustomJob(jobId, options = {}) {
  if (!jobId) {
    throw new Error('jobId is required to fetch custom job details');
  }
  return request(`${ROOT}/${jobId}`, options);
}

export async function getServicemanCustomJobReports(params = {}, options = {}) {
  const query = buildQuery(sanitisePayload(params));
  return request(`${ROOT}/reports${query}`, options);
}

export async function createServicemanCustomJobBid(jobId, payload = {}) {
  if (!jobId) {
    throw new Error('jobId is required to submit a bid');
  }
  return request(`${ROOT}/${jobId}/bids`, { method: 'POST', body: sanitisePayload(payload) });
}

export async function updateServicemanCustomJobBid(jobId, bidId, payload = {}) {
  if (!jobId || !bidId) {
    throw new Error('jobId and bidId are required to update a bid');
  }
  return request(`${ROOT}/${jobId}/bids/${bidId}`, { method: 'PATCH', body: sanitisePayload(payload) });
}

export async function withdrawServicemanCustomJobBid(jobId, bidId, payload = {}) {
  if (!jobId || !bidId) {
    throw new Error('jobId and bidId are required to withdraw a bid');
  }
  return request(`${ROOT}/${jobId}/bids/${bidId}/withdraw`, {
    method: 'POST',
    body: sanitisePayload(payload)
  });
}

export async function sendServicemanCustomJobBidMessage(jobId, bidId, payload = {}) {
  if (!jobId || !bidId) {
    throw new Error('jobId and bidId are required to send a message');
  }
  return request(`${ROOT}/${jobId}/bids/${bidId}/messages`, {
    method: 'POST',
    body: sanitisePayload(payload)
  });
}

export default {
  listServicemanCustomJobs,
  getServicemanCustomJob,
  getServicemanCustomJobReports,
  createServicemanCustomJobBid,
  updateServicemanCustomJobBid,
  withdrawServicemanCustomJobBid,
  sendServicemanCustomJobBidMessage
};
