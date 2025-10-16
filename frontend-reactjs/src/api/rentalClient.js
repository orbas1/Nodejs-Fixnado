const API_ROOT = '/api/rentals';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return {};
    }
    return response.json();
  }

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  const error = new Error(body?.message || fallbackMessage);
  error.status = response.status;
  error.code = body?.code;
  throw error;
}

function buildHeaders({ accept = 'application/json', json = false, extra } = {}) {
  const headers = new Headers({ Accept: accept });
  if (json) {
    headers.set('Content-Type', 'application/json');
  }
  if (extra) {
    const iterable = extra instanceof Headers ? extra.entries() : Object.entries(extra);
    for (const [key, value] of iterable) {
      headers.set(key, value);
    }
  }
  return headers;
}

export async function listRentals(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders({ accept: 'application/json', extra: extraHeaders });
  const response = await fetch(`${API_ROOT}${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load rentals');
}

export async function getRental(rentalId, options = {}) {
  if (!rentalId) {
    throw new Error('rentalId is required');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders({ accept: 'application/json', extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/${rentalId}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load rental');
}

export async function createRental(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Rental payload must be an object');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders({ accept: 'application/json', json: true, extra: extraHeaders });
  const response = await fetch(API_ROOT, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Unable to create rental request');
}

async function postAction(rentalId, path, payload = {}, options = {}, fallbackMessage) {
  if (!rentalId) {
    throw new Error('rentalId is required');
  }
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = buildHeaders({ accept: 'application/json', json: true, extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/${rentalId}/${path}`, {
    method: 'POST',
    headers,
    credentials,
    signal,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, fallbackMessage);
}

export function approveRental(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'approve', payload, options, 'Unable to approve rental');
}

export function scheduleRentalPickup(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'schedule-pickup', payload, options, 'Unable to schedule pickup');
}

export function checkoutRental(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'checkout', payload, options, 'Unable to check out rental');
}

export function markRentalReturned(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'return', payload, options, 'Unable to mark rental as returned');
}

export function completeRentalInspection(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'inspection', payload, options, 'Unable to complete inspection');
}

export function cancelRental(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'cancel', payload, options, 'Unable to cancel rental');
}

export function addRentalCheckpoint(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'checkpoints', payload, options, 'Unable to add rental checkpoint');
}

export function updateRentalDeposit(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'deposit', payload, options, 'Unable to update deposit');
}

export function startRentalDispute(rentalId, payload = {}, options = {}) {
  return postAction(rentalId, 'dispute', payload, options, 'Unable to start rental dispute');
}

export default {
  listRentals,
  getRental,
  createRental,
  approveRental,
  scheduleRentalPickup,
  checkoutRental,
  markRentalReturned,
  completeRentalInspection,
  cancelRental,
  addRentalCheckpoint,
  updateRentalDeposit,
  startRentalDispute
};
