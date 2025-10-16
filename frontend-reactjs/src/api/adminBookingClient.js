import { PanelApiError } from './panelClient.js';

const BASE_URL = '/api/admin/bookings';

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
  throw new PanelApiError(message, response.status);
}

export async function fetchBookingOverview(params = {}, { signal } = {}) {
  const url = new URL(`${BASE_URL}/overview`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    url.searchParams.set(key, value);
  });
  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response, 'Failed to load booking overview');
}

export async function fetchBookingSettings({ signal } = {}) {
  const response = await fetch(`${BASE_URL}/settings`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response, 'Failed to load booking settings');
}

export async function updateBookingSettings(body) {
  const response = await fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return handleResponse(response, 'Failed to save booking settings');
}

export async function createBooking(payload) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create booking');
}

export async function fetchBooking(bookingId, { signal } = {}) {
  const response = await fetch(`${BASE_URL}/${bookingId}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response, 'Failed to load booking');
}

export async function updateBookingStatus(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/status`, {
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

export async function updateBookingSchedule(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/schedule`, {
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

export async function updateBookingMeta(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/${bookingId}/meta`, {
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

export async function applyTemplateToBooking(bookingId, templateId) {
  const response = await fetch(`${BASE_URL}/${bookingId}/apply-template`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ templateId })
  });
  return handleResponse(response, 'Failed to apply template');
}

export async function listBookingTemplates({ includeRetired = false } = {}, { signal } = {}) {
  const url = `${BASE_URL}/templates${includeRetired ? '?includeRetired=true' : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal
  });
  return handleResponse(response, 'Failed to load booking templates');
}

export async function createBookingTemplateClient(payload) {
  const response = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create template');
}

export async function updateBookingTemplateClient(templateId, payload) {
  const response = await fetch(`${BASE_URL}/templates/${templateId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update template');
}

export async function archiveBookingTemplateClient(templateId) {
  const response = await fetch(`${BASE_URL}/templates/${templateId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  return handleResponse(response, 'Failed to archive template');
}
