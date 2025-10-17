const BASE_URL = '/api/serviceman/control-centre';

async function request(path, { method = 'GET', body, headers: extraHeaders, ...options } = {}) {
  const headers = new Headers(extraHeaders || {});
  if (body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers,
    credentials: 'include',
    ...options
  });

  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }
    const error = new Error(errorBody?.message || 'Request failed');
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchServicemanOverview(options) {
  return request('/overview', { method: 'GET', ...(options ?? {}) });
}

export function updateServicemanProfile(payload, options) {
  return request('/overview', { method: 'PUT', body: payload, ...(options ?? {}) });
}

export function createShiftRule(payload, options) {
  return request('/overview/availability', { method: 'POST', body: payload, ...(options ?? {}) });
}

export function updateShiftRule(id, payload, options) {
  return request(`/overview/availability/${id}`, { method: 'PUT', body: payload, ...(options ?? {}) });
}

export function deleteShiftRule(id, options) {
  return request(`/overview/availability/${id}`, { method: 'DELETE', ...(options ?? {}) });
}

export function createCertification(payload, options) {
  return request('/overview/certifications', { method: 'POST', body: payload, ...(options ?? {}) });
}

export function updateCertification(id, payload, options) {
  return request(`/overview/certifications/${id}`, { method: 'PUT', body: payload, ...(options ?? {}) });
}

export function deleteCertification(id, options) {
  return request(`/overview/certifications/${id}`, { method: 'DELETE', ...(options ?? {}) });
}

export function createEquipment(payload, options) {
  return request('/overview/equipment', { method: 'POST', body: payload, ...(options ?? {}) });
}

export function updateEquipment(id, payload, options) {
  return request(`/overview/equipment/${id}`, { method: 'PUT', body: payload, ...(options ?? {}) });
}

export function deleteEquipment(id, options) {
  return request(`/overview/equipment/${id}`, { method: 'DELETE', ...(options ?? {}) });
}

export default {
  fetchServicemanOverview,
  updateServicemanProfile,
  createShiftRule,
  updateShiftRule,
  deleteShiftRule,
  createCertification,
  updateCertification,
  deleteCertification,
  createEquipment,
  updateEquipment,
  deleteEquipment
};
