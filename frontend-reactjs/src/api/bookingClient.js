const API_ROOT = '/api/bookings';

function handleError(message, response) {
  const error = new Error(message);
  error.status = response.status;
  return error;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function startBookingDispute(bookingId, payload = {}, options = {}) {
  if (!bookingId) {
    throw new Error('bookingId is required to start a dispute');
  }

  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  if (extraHeaders) {
    const iterable = extraHeaders instanceof Headers ? extraHeaders.entries() : Object.entries(extraHeaders);
    for (const [key, value] of iterable) {
      headers.set(key, value);
    }
  }

  const response = await fetch(`${API_ROOT}/${bookingId}/disputes`, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload || {})
  });

  if (response.ok) {
    return response.json();
  }

  const body = await parseJson(response);
  throw handleError(body?.message || 'Unable to start dispute', response);
}

export default {
  startBookingDispute
};
