const BASE_URL = '/api/providers/calendar';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }
    search.set(key, value);
  });
  const result = search.toString();
  return result ? `?${result}` : '';
}

async function handleResponse(response, fallbackMessage = 'Calendar request failed') {
  if (response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  let body = {};
  try {
    body = await response.json();
  } catch (error) {
    body = {};
  }
  const error = new Error(body?.message || fallbackMessage);
  error.status = response.status;
  throw error;
}

export async function fetchProviderCalendar(params = {}) {
  const response = await fetch(`${BASE_URL}${toQuery(params)}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  return handleResponse(response, 'Failed to load provider calendar');
}

export async function updateProviderCalendarSettings(payload) {
  const response = await fetch(`${BASE_URL}/settings`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update calendar settings');
}

export async function createCalendarEvent(payload) {
  const response = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create calendar event');
}

export async function updateCalendarEvent(eventId, payload) {
  const response = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update calendar event');
}

export async function deleteCalendarEvent(eventId, params = {}) {
  const response = await fetch(`${BASE_URL}/events/${eventId}${toQuery(params)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.status === 204) {
    return true;
  }
  await handleResponse(response, 'Failed to delete calendar event');
  return true;
}

export async function updateCalendarBooking(bookingId, payload) {
  const response = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update booking schedule');
}

export async function createCalendarBooking(payload) {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create booking');
}

export default {
  fetchProviderCalendar,
  updateProviderCalendarSettings,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateCalendarBooking,
  createCalendarBooking
};
