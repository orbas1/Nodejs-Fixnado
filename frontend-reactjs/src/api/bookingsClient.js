const BASE_ENDPOINT = '/api/bookings';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  let errorBody = {};
  try {
    errorBody = await response.json();
  } catch {
    errorBody = {};
  }

  const message = errorBody?.message || fallbackMessage || 'Booking request failed';
  const error = new Error(message);
  error.status = response.status;
  error.details = errorBody?.errors ?? null;
  throw error;
}

export async function fetchBookingCalendar(params = {}, { signal } = {}) {
  const url = new URL(`${BASE_ENDPOINT}/calendar`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, entry));
    } else {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  return handleResponse(response, 'Unable to load calendar');
}

export async function fetchBooking(bookingId, { signal } = {}) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Unable to load booking');
}

export async function fetchBookingAssignments(bookingId, { signal } = {}) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/assignments`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Unable to load crew assignments');
}

export async function createBooking(payload, { signal } = {}) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload ?? {}),
    signal
  });
  return handleResponse(response, 'Unable to create booking');
}

export async function updateBooking(bookingId, payload, { signal } = {}) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload ?? {}),
    signal
  });
  return handleResponse(response, 'Unable to update booking');
}

export async function createBookingAssignment(bookingId, payload, { signal } = {}) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const assignments = Array.isArray(payload?.assignments)
    ? payload.assignments
    : [{ providerId: payload?.providerId, role: payload?.role }];
  const actorId = payload?.actorId;
  const body = { assignments };
  if (actorId) {
    body.actorId = actorId;
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body),
    signal
  });
  return handleResponse(response, 'Unable to create crew assignment');
}

export async function updateBookingAssignment(bookingId, assignmentId, payload, { signal } = {}) {
  if (!bookingId || !assignmentId) {
    throw new Error('Booking and assignment identifiers are required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/assignments/${assignmentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload ?? {}),
    signal
  });
  return handleResponse(response, 'Unable to update crew assignment');
}

export async function deleteBookingAssignment(bookingId, assignmentId, { actorId } = {}, { signal } = {}) {
  if (!bookingId || !assignmentId) {
    throw new Error('Booking and assignment identifiers are required');
  }
  const url = new URL(`${BASE_ENDPOINT}/${bookingId}/assignments/${assignmentId}`, window.location.origin);
  if (actorId) {
    url.searchParams.set('actorId', actorId);
  }
  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    method: 'DELETE',
    credentials: 'include',
    signal
  });
  await handleResponse(response, 'Unable to remove crew assignment');
  return true;
}

export async function fetchBookingNotes(bookingId, { signal } = {}) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/notes`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  return handleResponse(response, 'Unable to load notes');
}

export async function createBookingNote(bookingId, payload, { signal } = {}) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload ?? {}),
    signal
  });
  return handleResponse(response, 'Unable to create note');
}

export async function updateBookingNote(bookingId, noteId, payload, { signal } = {}) {
  if (!bookingId || !noteId) {
    throw new Error('Booking and note identifiers are required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/notes/${noteId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload ?? {}),
    signal
  });
  return handleResponse(response, 'Unable to update note');
}

export async function deleteBookingNote(bookingId, noteId, { signal } = {}) {
  if (!bookingId || !noteId) {
    throw new Error('Booking and note identifiers are required');
  }
  const response = await fetch(`${BASE_ENDPOINT}/${bookingId}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'include',
    signal
  });
  await handleResponse(response, 'Unable to delete note');
  return true;
}

export default {
  fetchBookingCalendar,
  fetchBooking,
  createBooking,
  updateBooking,
  fetchBookingAssignments,
  createBookingAssignment,
  updateBookingAssignment,
  deleteBookingAssignment,
  fetchBookingNotes,
  createBookingNote,
  updateBookingNote,
  deleteBookingNote
};
