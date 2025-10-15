import { PanelApiError } from './panelClient.js';

async function handleResponse(response) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let errorBody = null;
  try {
    errorBody = await response.json();
  } catch {
    // ignore parsing issues
  }
  const message = errorBody?.message || response.statusText || 'Compliance request failed';
  throw new PanelApiError(message, response.status, { cause: errorBody });
}

export async function createDataSubjectRequest(payload, { signal } = {}) {
  try {
    const response = await fetch('/api/compliance/data-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while submitting data subject request', 503, { cause: error });
  }
}

export async function fetchDataSubjectRequests(
  { status, requestType, regionCode, submittedAfter, submittedBefore, subjectEmail, limit = 50 } = {},
  { signal } = {}
) {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }
  if (requestType) {
    params.set('requestType', requestType);
  }
  if (regionCode) {
    params.set('regionCode', regionCode);
  }
  if (submittedAfter) {
    params.set('submittedAfter', submittedAfter);
  }
  if (submittedBefore) {
    params.set('submittedBefore', submittedBefore);
  }
  if (subjectEmail) {
    params.set('subjectEmail', subjectEmail);
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  try {
    const response = await fetch(`/api/compliance/data-requests?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while loading data subject requests', 503, { cause: error });
  }
}

export async function triggerDataSubjectExport(requestId, payload = {}, { signal } = {}) {
  try {
    const response = await fetch(`/api/compliance/data-requests/${encodeURIComponent(requestId)}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while generating data export', 503, { cause: error });
  }
}

export async function updateDataSubjectRequestStatus(requestId, payload, { signal } = {}) {
  try {
    const response = await fetch(`/api/compliance/data-requests/${encodeURIComponent(requestId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while updating request status', 503, { cause: error });
  }
}

export async function fetchWarehouseExportRuns({ dataset, regionCode, limit = 50 } = {}, { signal } = {}) {
  const params = new URLSearchParams();
  if (dataset) {
    params.set('dataset', dataset);
  }
  if (regionCode) {
    params.set('regionCode', regionCode);
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  try {
    const response = await fetch(`/api/compliance/data-warehouse/runs?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while loading warehouse export runs', 503, { cause: error });
  }
}

export async function triggerWarehouseExportRun(payload, { signal } = {}) {
  try {
    const response = await fetch('/api/compliance/data-warehouse/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while triggering warehouse export', 503, { cause: error });
  }
}

export async function fetchDataSubjectRequestMetrics(
  { status, requestType, regionCode, submittedAfter, submittedBefore, subjectEmail } = {},
  { signal } = {}
) {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }
  if (requestType) {
    params.set('requestType', requestType);
  }
  if (regionCode) {
    params.set('regionCode', regionCode);
  }
  if (submittedAfter) {
    params.set('submittedAfter', submittedAfter);
  }
  if (submittedBefore) {
    params.set('submittedBefore', submittedBefore);
  }
  if (subjectEmail) {
    params.set('subjectEmail', subjectEmail);
  }

  try {
    const response = await fetch(`/api/compliance/data-requests/metrics?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal
    });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Network error while loading compliance metrics', 503, { cause: error });
  }
}
