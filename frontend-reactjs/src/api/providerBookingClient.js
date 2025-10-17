const BASE_URL = '/api/provider/bookings';

function buildUrl(path = '', params = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }
    url.searchParams.set(key, value);
  });
  return url.toString().replace(window.location.origin, '');
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  let message = fallbackMessage;
  try {
    const payload = await response.json();
    message = payload?.message || fallbackMessage;
  } catch {
    // ignore JSON parse errors
  }
  const error = new Error(message);
  error.status = response.status;
  error.code = response.status;
  throw error;
}

export async function fetchProviderBookingWorkspace(params = {}, { signal } = {}) {
  const response = await fetch(buildUrl('/workspace', params), {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response, 'Failed to load provider booking workspace');
}

export async function updateProviderBookingSettings(payload = {}, params = {}) {
  const response = await fetch(buildUrl('/settings', params), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update booking settings');
}

export async function updateProviderBookingStatus(bookingId, payload = {}, params = {}) {
  const response = await fetch(buildUrl(`/${bookingId}/status`, params), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update booking status');
}

export async function updateProviderBookingSchedule(bookingId, payload = {}, params = {}) {
  const response = await fetch(buildUrl(`/${bookingId}/schedule`, params), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update booking schedule');
}

export async function updateProviderBookingDetails(bookingId, payload = {}, params = {}) {
  const response = await fetch(buildUrl(`/${bookingId}/details`, params), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update booking details');
}

export async function createProviderBookingNote(bookingId, payload = {}, params = {}) {
  const response = await fetch(buildUrl(`/${bookingId}/notes`, params), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to record booking note');
}

export async function createProviderTimelineEntry(bookingId, payload = {}, params = {}) {
  const response = await fetch(buildUrl(`/${bookingId}/history`, params), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to record timeline entry');
}

export default {
  fetchProviderBookingWorkspace,
  updateProviderBookingSettings,
  updateProviderBookingStatus,
  updateProviderBookingSchedule,
  updateProviderBookingDetails,
  createProviderBookingNote,
  createProviderTimelineEntry
};
