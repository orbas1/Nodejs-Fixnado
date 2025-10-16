const BASE_URL = '/api/serviceman/bookings';

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

function buildUrl(path = '', params = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString().replace(window.location.origin, '');
}

export async function fetchServicemanWorkspace(params = {}, { signal } = {}) {
  const response = await fetch(buildUrl('/workspace', params), {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response, 'Failed to load booking workspace');
}

export async function updateServicemanSettings(payload) {
  const response = await fetch(`${BASE_URL}/settings`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Failed to update booking settings');
}

export async function updateServicemanBookingStatus(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Failed to update booking status');
}

export async function updateServicemanBookingSchedule(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/schedule`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Failed to update booking schedule');
}

export async function updateServicemanBookingDetails(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/details`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Failed to update booking details');
}

export async function createServicemanBookingNote(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Failed to record booking note');
}

export async function createServicemanTimelineEntry(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/history`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  });
  return handleResponse(response, 'Failed to record timeline entry');
}

export default {
  fetchServicemanWorkspace,
  updateServicemanSettings,
  updateServicemanBookingStatus,
  updateServicemanBookingSchedule,
  updateServicemanBookingDetails,
  createServicemanBookingNote,
  createServicemanTimelineEntry
};
