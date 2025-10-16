const ADMIN_RENTALS_ROOT = '/api/admin/rentals';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      const abort = () => controller.abort();
      signal.addEventListener('abort', abort, { once: true });
      controller.signal.addEventListener('abort', () => signal.removeEventListener('abort', abort), { once: true });
    }
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    const networkError = new Error('Unable to reach rental management services');
    networkError.cause = error;
    throw networkError;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  let payload = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[rentalAdminClient] Failed to parse JSON response', error);
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

export function listAdminRentals(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ADMIN_RENTALS_ROOT}${query}`, { signal: options.signal });
}

export function createAdminRental(payload, options = {}) {
  return request(ADMIN_RENTALS_ROOT, { method: 'POST', body: payload, signal: options.signal });
}

export function getAdminRental(rentalId, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}`, { signal: options.signal });
}

export function updateAdminRental(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}`, {
    method: 'PATCH',
    body: payload,
    signal: options.signal
  });
}

export function approveAdminRental(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/approve`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export function scheduleAdminRentalPickup(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/schedule-pickup`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export function checkoutAdminRental(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/checkout`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export function markAdminRentalReturned(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/return`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export function inspectAdminRental(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/inspection`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export function cancelAdminRental(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/cancel`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export function addAdminRentalCheckpoint(rentalId, payload = {}, options = {}) {
  return request(`${ADMIN_RENTALS_ROOT}/${encodeURIComponent(rentalId)}/checkpoints`, {
    method: 'POST',
    body: payload,
    signal: options.signal
  });
}

export default {
  listAdminRentals,
  createAdminRental,
  getAdminRental,
  approveAdminRental,
  scheduleAdminRentalPickup,
  checkoutAdminRental,
  markAdminRentalReturned,
  inspectAdminRental,
  cancelAdminRental,
  addAdminRentalCheckpoint,
  updateAdminRental
};
