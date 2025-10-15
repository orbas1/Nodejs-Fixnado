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

export async function fetchDataSubjectRequests({ status, limit = 50 } = {}, { signal } = {}) {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
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
