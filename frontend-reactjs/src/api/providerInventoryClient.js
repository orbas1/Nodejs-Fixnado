const ROOT = '/api/inventory';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== '') {
          searchParams.append(key, entry);
        }
      });
      return;
    }
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
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
    const networkError = new Error('Unable to contact inventory services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[providerInventoryClient] failed to parse JSON response', error);
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

export async function listInventoryItems(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/items${query}`, options);
}

export async function getInventoryItem(itemId, params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/items/${itemId}${query}`, options);
}

export async function createInventoryItem(payload, options = {}) {
  return request(`${ROOT}/items`, { method: 'POST', body: payload, ...options });
}

export async function updateInventoryItem(itemId, payload, options = {}) {
  return request(`${ROOT}/items/${itemId}`, { method: 'PUT', body: payload, ...options });
}

export async function deleteInventoryItem(itemId, options = {}) {
  return request(`${ROOT}/items/${itemId}`, { method: 'DELETE', ...options });
}

export async function createInventoryAdjustment(itemId, payload, options = {}) {
  return request(`${ROOT}/items/${itemId}/adjustments`, { method: 'POST', body: payload, ...options });
}

export async function listCategories(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/categories${query}`, options);
}

export async function createCategory(payload, options = {}) {
  return request(`${ROOT}/categories`, { method: 'POST', body: payload, ...options });
}

export async function updateCategory(categoryId, payload, options = {}) {
  return request(`${ROOT}/categories/${categoryId}`, { method: 'PUT', body: payload, ...options });
}

export async function deleteCategory(categoryId, options = {}) {
  return request(`${ROOT}/categories/${categoryId}`, { method: 'DELETE', ...options });
}

export async function listTags(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/tags${query}`, options);
}

export async function createTag(payload, options = {}) {
  return request(`${ROOT}/tags`, { method: 'POST', body: payload, ...options });
}

export async function updateTag(tagId, payload, options = {}) {
  return request(`${ROOT}/tags/${tagId}`, { method: 'PUT', body: payload, ...options });
}

export async function deleteTag(tagId, options = {}) {
  return request(`${ROOT}/tags/${tagId}`, { method: 'DELETE', ...options });
}

export async function setItemTags(itemId, tagIds = [], options = {}) {
  return request(`${ROOT}/items/${itemId}/tags`, { method: 'POST', body: { tagIds }, ...options });
}

export async function listZones(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/zones${query}`, options);
}

export async function createZone(payload, options = {}) {
  return request(`${ROOT}/zones`, { method: 'POST', body: payload, ...options });
}

export async function updateZone(zoneId, payload, options = {}) {
  return request(`${ROOT}/zones/${zoneId}`, { method: 'PUT', body: payload, ...options });
}

export async function deleteZone(zoneId, options = {}) {
  return request(`${ROOT}/zones/${zoneId}`, { method: 'DELETE', ...options });
}

export async function listSuppliers(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/suppliers${query}`, options);
}

export async function listItemSuppliers(itemId, options = {}) {
  return request(`${ROOT}/items/${itemId}/suppliers`, options);
}

export async function upsertItemSupplier(itemId, payload, options = {}) {
  if (payload?.id) {
    return request(`${ROOT}/items/${itemId}/suppliers/${payload.id}`, { method: 'PUT', body: payload, ...options });
  }
  return request(`${ROOT}/items/${itemId}/suppliers`, { method: 'POST', body: payload, ...options });
}

export async function deleteItemSupplier(itemId, supplierLinkId, options = {}) {
  return request(`${ROOT}/items/${itemId}/suppliers/${supplierLinkId}`, { method: 'DELETE', ...options });
}

export async function listItemMedia(itemId, options = {}) {
  return request(`${ROOT}/items/${itemId}/media`, options);
}

export async function createItemMedia(itemId, payload, options = {}) {
  return request(`${ROOT}/items/${itemId}/media`, { method: 'POST', body: payload, ...options });
}

export async function updateItemMedia(itemId, mediaId, payload, options = {}) {
  return request(`${ROOT}/items/${itemId}/media/${mediaId}`, { method: 'PUT', body: payload, ...options });
}

export async function deleteItemMedia(itemId, mediaId, options = {}) {
  return request(`${ROOT}/items/${itemId}/media/${mediaId}`, { method: 'DELETE', ...options });
}

export default {
  listInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryAdjustment,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  setItemTags,
  listZones,
  createZone,
  updateZone,
  deleteZone,
  listSuppliers,
  listItemSuppliers,
  upsertItemSupplier,
  deleteItemSupplier,
  listItemMedia,
  createItemMedia,
  updateItemMedia,
  deleteItemMedia
};
