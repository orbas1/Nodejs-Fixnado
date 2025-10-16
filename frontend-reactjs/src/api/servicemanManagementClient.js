const BASE_PATH = '/api/admin/servicemen';

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.append(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_PATH}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: payload,
    signal
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    const error = new Error(data?.message || 'Serviceman management request failed');
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return response.json();
}

export function getOverview(params, options) {
  const query = buildQuery(params);
  return request(query, { method: 'GET', ...options });
}

export function createProfile(payload, options) {
  return request('', { method: 'POST', body: payload, ...options });
}

export function updateProfile(profileId, payload, options) {
  return request(`/${profileId}`, { method: 'PUT', body: payload, ...options });
}

export function deleteProfile(profileId, options) {
  return request(`/${profileId}`, { method: 'DELETE', ...options });
}

export function createShift(profileId, payload, options) {
  return request(`/${profileId}/shifts`, { method: 'POST', body: payload, ...options });
}

export function updateShift(profileId, shiftId, payload, options) {
  return request(`/${profileId}/shifts/${shiftId}`, { method: 'PUT', body: payload, ...options });
}

export function deleteShift(profileId, shiftId, options) {
  return request(`/${profileId}/shifts/${shiftId}`, { method: 'DELETE', ...options });
}

export function createCertification(profileId, payload, options) {
  return request(`/${profileId}/certifications`, { method: 'POST', body: payload, ...options });
}

export function updateCertification(profileId, certificationId, payload, options) {
  return request(`/${profileId}/certifications/${certificationId}`, {
    method: 'PUT',
    body: payload,
    ...options
  });
}

export function deleteCertification(profileId, certificationId, options) {
  return request(`/${profileId}/certifications/${certificationId}`, {
    method: 'DELETE',
    ...options
  });
}

export default {
  getOverview,
  createProfile,
  updateProfile,
  deleteProfile,
  createShift,
  updateShift,
  deleteShift,
  createCertification,
  updateCertification,
  deleteCertification
};
