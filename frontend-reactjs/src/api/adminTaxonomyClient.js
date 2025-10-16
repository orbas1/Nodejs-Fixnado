const TAXONOMY_ENDPOINT = '/api/admin/taxonomy';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  const errorPayload = await response.json().catch(() => ({}));
  const error = new Error(errorPayload?.message || fallbackMessage);
  error.status = response.status;
  error.details = errorPayload?.details;
  throw error;
}

export async function fetchAdminTaxonomy({ includeArchived = true, signal } = {}) {
  const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  const url = new URL(TAXONOMY_ENDPOINT, baseUrl);
  if (includeArchived) {
    url.searchParams.set('includeArchived', 'true');
  }

  const endpoint = `${url.pathname}${url.search}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load taxonomy settings');
  return {
    taxonomy: payload?.taxonomy ?? { types: [], categories: [] },
    meta: payload?.meta ?? { totals: {}, lastUpdatedAt: null }
  };
}

export async function upsertAdminTaxonomyType(body) {
  const hasId = Boolean(body?.id);
  const endpoint = hasId ? `${TAXONOMY_ENDPOINT}/types/${body.id}` : `${TAXONOMY_ENDPOINT}/types`;
  const response = await fetch(endpoint, {
    method: hasId ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to save taxonomy type');
  return payload?.type ?? null;
}

export async function archiveAdminTaxonomyType(typeId) {
  const response = await fetch(`${TAXONOMY_ENDPOINT}/types/${typeId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  const payload = await handleResponse(response, 'Failed to archive taxonomy type');
  return payload?.type ?? null;
}

export async function upsertAdminTaxonomyCategory(body) {
  const hasId = Boolean(body?.id);
  const endpoint = hasId ? `${TAXONOMY_ENDPOINT}/categories/${body.id}` : `${TAXONOMY_ENDPOINT}/categories`;
  const response = await fetch(endpoint, {
    method: hasId ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to save taxonomy category');
  return payload?.category ?? null;
}

export async function archiveAdminTaxonomyCategory(categoryId) {
  const response = await fetch(`${TAXONOMY_ENDPOINT}/categories/${categoryId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  const payload = await handleResponse(response, 'Failed to archive taxonomy category');
  return payload?.category ?? null;
}
