import { PanelApiError } from './panelClient.js';

async function parseJson(response) {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    console.warn('[adminServiceClient] failed to parse JSON response', error);
    return null;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  try {
    const response = await fetch(`/api/admin/services${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      const message = payload?.message || response.statusText || 'Admin service request failed';
      throw new PanelApiError(message, response.status, { details: payload });
    }

    return payload;
  } catch (error) {
    if (error instanceof PanelApiError) {
      throw error;
    }
    throw new PanelApiError('Admin service request failed', 503, { cause: error });
  }
}

export async function listAdminServiceCategories({ includeInactive = true } = {}) {
  const query = includeInactive ? '' : '?includeInactive=false';
  const payload = await request(`/categories${query}`);
  return payload?.categories ?? [];
}

export async function createAdminServiceCategory(input) {
  const payload = await request('/categories', { method: 'POST', body: input });
  return payload?.category ?? null;
}

export async function updateAdminServiceCategory(categoryId, updates) {
  const payload = await request(`/categories/${encodeURIComponent(categoryId)}`, {
    method: 'PUT',
    body: updates
  });
  return payload?.category ?? null;
}

export async function archiveAdminServiceCategory(categoryId) {
  const payload = await request(`/categories/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE'
  });
  return payload?.category ?? null;
}

export async function listAdminServiceListings(params = {}) {
  const query = new URLSearchParams();
  if (params.limit != null) query.set('limit', String(params.limit));
  if (params.offset != null) query.set('offset', String(params.offset));
  if (params.statuses?.length) query.set('statuses', params.statuses.join(','));
  if (params.visibility) query.set('visibility', params.visibility);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.providerId) query.set('providerId', params.providerId);
  if (params.companyId) query.set('companyId', params.companyId);
  if (params.search) query.set('search', params.search);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/listings${suffix}`);
}

export async function createAdminServiceListing(input) {
  const payload = await request('/listings', { method: 'POST', body: input });
  return payload?.listing ?? null;
}

export async function updateAdminServiceListing(serviceId, updates) {
  const payload = await request(`/listings/${encodeURIComponent(serviceId)}`, {
    method: 'PUT',
    body: updates
  });
  return payload?.listing ?? null;
}

export async function updateAdminServiceListingStatus(serviceId, status) {
  const payload = await request(`/listings/${encodeURIComponent(serviceId)}/status`, {
    method: 'PATCH',
    body: { status }
  });
  return payload?.listing ?? null;
}

export async function archiveAdminServiceListing(serviceId) {
  const payload = await request(`/listings/${encodeURIComponent(serviceId)}`, {
    method: 'DELETE'
  });
  return payload?.listing ?? null;
}

export async function getAdminServiceSummary(options = {}) {
  const { listingLimit, packageLimit, signal } = options;
  const query = new URLSearchParams();
  if (listingLimit != null) query.set('listingLimit', String(listingLimit));
  if (packageLimit != null) query.set('packageLimit', String(packageLimit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/summary${suffix}`, { signal });
}

export default {
  listAdminServiceCategories,
  createAdminServiceCategory,
  updateAdminServiceCategory,
  archiveAdminServiceCategory,
  listAdminServiceListings,
  createAdminServiceListing,
  updateAdminServiceListing,
  updateAdminServiceListingStatus,
  archiveAdminServiceListing,
  getAdminServiceSummary
};
