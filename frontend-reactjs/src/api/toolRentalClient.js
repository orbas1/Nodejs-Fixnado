const API_ROOT = '/api/tool-rentals';

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.append(key, value);
  });
  const result = search.toString();
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

export async function listAssets(params = {}, options = {}) {
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/assets${buildQuery(params)}`, {
    method: 'GET',
    headers,
    signal,
    credentials
  });
  return handleResponse(response, 'Unable to load tool rental assets');
}

export async function createAsset(payload, options = {}) {
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders, json: true });
  const response = await fetch(`${API_ROOT}/assets`, {
    method: 'POST',
    headers,
    signal,
    credentials,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, 'Unable to create asset');
}

export async function getAsset(assetId, params = {}, options = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/assets/${assetId}${buildQuery(params)}`, {
    method: 'GET',
    headers,
    signal,
    credentials
  });
  return handleResponse(response, 'Unable to load asset');
}

export async function updateAsset(assetId, payload, options = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders, json: true });
  const response = await fetch(`${API_ROOT}/assets/${assetId}`, {
    method: 'PATCH',
    headers,
    signal,
    credentials,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, 'Unable to update asset');
}

export async function getAvailability(assetId, params = {}, options = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/assets/${assetId}/availability${buildQuery(params)}`, {
    method: 'GET',
    headers,
    signal,
    credentials
  });
  return handleResponse(response, 'Unable to load availability');
}

export async function createPricingTier(assetId, payload, options = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders, json: true });
  const response = await fetch(`${API_ROOT}/assets/${assetId}/pricing`, {
    method: 'POST',
    headers,
    signal,
    credentials,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, 'Unable to create pricing tier');
}

export async function updatePricingTier(assetId, pricingId, payload, options = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  if (!pricingId) {
    throw new Error('pricingId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders, json: true });
  const response = await fetch(`${API_ROOT}/assets/${assetId}/pricing/${pricingId}`, {
    method: 'PATCH',
    headers,
    signal,
    credentials,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, 'Unable to update pricing tier');
}

export async function deletePricingTier(assetId, pricingId, options = {}) {
  if (!assetId) {
    throw new Error('assetId is required');
  }
  if (!pricingId) {
    throw new Error('pricingId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/assets/${assetId}/pricing/${pricingId}`, {
    method: 'DELETE',
    headers,
    signal,
    credentials
  });
  return handleResponse(response, 'Unable to delete pricing tier');
}

export async function listCoupons(params = {}, options = {}) {
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/coupons${buildQuery(params)}`, {
    method: 'GET',
    headers,
    signal,
    credentials
  });
  return handleResponse(response, 'Unable to load coupons');
}

export async function createCoupon(payload, options = {}) {
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders, json: true });
  const response = await fetch(`${API_ROOT}/coupons`, {
    method: 'POST',
    headers,
    signal,
    credentials,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, 'Unable to create coupon');
}

export async function updateCoupon(couponId, payload, options = {}) {
  if (!couponId) {
    throw new Error('couponId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders, json: true });
  const response = await fetch(`${API_ROOT}/coupons/${couponId}`, {
    method: 'PATCH',
    headers,
    signal,
    credentials,
    body: JSON.stringify(payload || {})
  });
  return handleResponse(response, 'Unable to update coupon');
}

export async function deleteCoupon(couponId, options = {}) {
  if (!couponId) {
    throw new Error('couponId is required');
  }
  const { signal, credentials = 'include', headers: extraHeaders } = options;
  const headers = buildHeaders({ extra: extraHeaders });
  const response = await fetch(`${API_ROOT}/coupons/${couponId}`, {
    method: 'DELETE',
    headers,
    signal,
    credentials
  });
  return handleResponse(response, 'Unable to delete coupon');
}

export default {
  listAssets,
  createAsset,
  getAsset,
  updateAsset,
  getAvailability,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
};
