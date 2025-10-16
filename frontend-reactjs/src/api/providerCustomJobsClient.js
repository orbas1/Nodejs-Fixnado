const BASE_ENDPOINT = '/api/provider/custom-jobs';

function buildQuery(params = {}) {
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
    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
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

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  const message = payload?.message || payload?.error || fallbackMessage;
  const error = new Error(message);
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

export async function getProviderCustomJobWorkspace(params = {}, { signal } = {}) {
  const query = buildQuery(params);
  const response = await fetch(`${BASE_ENDPOINT}/workspace${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Unable to load provider custom jobs workspace');
}

export async function searchProviderJobOpportunities(filters = {}, { signal } = {}) {
  const query = buildQuery(filters);
  const response = await fetch(`${BASE_ENDPOINT}/opportunities${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Unable to load custom job opportunities');
}

export async function submitProviderJobBid(postId, payload) {
  if (!postId) {
    throw new Error('postId is required to submit a bid');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/opportunities/${postId}/bids`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to submit bid');
}

export async function updateProviderJobBid(bidId, payload) {
  if (!bidId) {
    throw new Error('bidId is required to update a bid');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/bids/${bidId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to update bid');
}

export async function withdrawProviderJobBid(bidId) {
  if (!bidId) {
    throw new Error('bidId is required to withdraw a bid');
  }
  const response = await fetch(`${BASE_ENDPOINT}/bids/${bidId}/withdraw`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({})
  });
  return handleResponse(response, 'Unable to withdraw bid');
}

export async function sendProviderBidMessage(bidId, payload) {
  if (!bidId) {
    throw new Error('bidId is required to send a message');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/bids/${bidId}/messages`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to send message');
}

export async function createProviderCustomJobReport(payload) {
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/reports`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to create report');
}

export async function updateProviderCustomJobReport(reportId, payload) {
  if (!reportId) {
    throw new Error('reportId is required to update a report');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/reports/${reportId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to update report');
}

export async function deleteProviderCustomJobReport(reportId) {
  if (!reportId) {
    throw new Error('reportId is required to delete a report');
  }
  const response = await fetch(`${BASE_ENDPOINT}/reports/${reportId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  return handleResponse(response, 'Unable to delete report');
}

export async function createProviderCustomJob(payload) {
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}`, {
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

export async function inviteProviderJobParticipant(postId, payload) {
  if (!postId) {
    throw new Error('postId is required to send an invitation');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/${postId}/invitations`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to send invitation');
}

export async function updateProviderJobInvitation(invitationId, payload) {
  if (!invitationId) {
    throw new Error('invitationId is required to update an invitation');
  }
  const body = sanitisePayload(payload);
  const response = await fetch(`${BASE_ENDPOINT}/invitations/${invitationId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Unable to update invitation');
}

export default {
  getProviderCustomJobWorkspace,
  searchProviderJobOpportunities,
  submitProviderJobBid,
  updateProviderJobBid,
  withdrawProviderJobBid,
  sendProviderBidMessage,
  createProviderCustomJobReport,
  updateProviderCustomJobReport,
  deleteProviderCustomJobReport
};
