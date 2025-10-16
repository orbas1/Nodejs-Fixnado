const ADMIN_WEBSITE_ROOT = '/api/admin/website';

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
    const networkError = new Error('Unable to contact website management services');
    networkError.cause = error;
    throw networkError;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let payload = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[websiteClient] failed to parse JSON response', error);
    }
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = payload?.details;
    throw error;
  }

  return payload;
}

export function listWebsitePages(options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/pages`, options);
}

export function getWebsitePage(pageId, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/pages/${encodeURIComponent(pageId)}`, options);
}

export function createWebsitePage(payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/pages`, { ...options, method: 'POST', body: payload });
}

export function updateWebsitePage(pageId, payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/pages/${encodeURIComponent(pageId)}`, {
    ...options,
    method: 'PUT',
    body: payload
  });
}

export function deleteWebsitePage(pageId, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/pages/${encodeURIComponent(pageId)}`, {
    ...options,
    method: 'DELETE'
  });
}

export function createWebsiteBlock(pageId, payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/pages/${encodeURIComponent(pageId)}/blocks`, {
    ...options,
    method: 'POST',
    body: payload
  });
}

export function updateWebsiteBlock(blockId, payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/blocks/${encodeURIComponent(blockId)}`, {
    ...options,
    method: 'PATCH',
    body: payload
  });
}

export function deleteWebsiteBlock(blockId, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/blocks/${encodeURIComponent(blockId)}`, {
    ...options,
    method: 'DELETE'
  });
}

export function listWebsiteNavigation(options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation`, options);
}

export function createWebsiteNavigationMenu(payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation`, { ...options, method: 'POST', body: payload });
}

export function updateWebsiteNavigationMenu(menuId, payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation/${encodeURIComponent(menuId)}`, {
    ...options,
    method: 'PATCH',
    body: payload
  });
}

export function deleteWebsiteNavigationMenu(menuId, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation/${encodeURIComponent(menuId)}`, {
    ...options,
    method: 'DELETE'
  });
}

export function createWebsiteNavigationItem(menuId, payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation/${encodeURIComponent(menuId)}/items`, {
    ...options,
    method: 'POST',
    body: payload
  });
}

export function updateWebsiteNavigationItem(itemId, payload, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation/items/${encodeURIComponent(itemId)}`, {
    ...options,
    method: 'PATCH',
    body: payload
  });
}

export function deleteWebsiteNavigationItem(itemId, options = {}) {
  return request(`${ADMIN_WEBSITE_ROOT}/navigation/items/${encodeURIComponent(itemId)}`, {
    ...options,
    method: 'DELETE'
  });
}
