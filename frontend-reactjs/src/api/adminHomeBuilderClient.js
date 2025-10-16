const ADMIN_HOME_BUILDER_ROOT = '/api/admin/home-builder';

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
    const networkError = new Error('Unable to contact home builder services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[adminHomeBuilderClient] failed to parse JSON response', error);
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

export function listAdminHomePages(options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages`, options);
}

export function createAdminHomePage(payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages`, { method: 'POST', body: payload, ...options });
}

export function getAdminHomePage(pageId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}`, options);
}

export function updateAdminHomePage(pageId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}`, { method: 'PUT', body: payload, ...options });
}

export function duplicateAdminHomePage(pageId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}/duplicate`, { method: 'POST', ...options });
}

export function publishAdminHomePage(pageId, payload = {}, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}/publish`, {
    method: 'PATCH',
    body: payload,
    ...options
  });
}

export function archiveAdminHomePage(pageId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}/archive`, { method: 'PATCH', ...options });
}

export function deleteAdminHomePage(pageId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}`, { method: 'DELETE', ...options });
}

export function createAdminHomePageSection(pageId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/pages/${pageId}/sections`, {
    method: 'POST',
    body: payload,
    ...options
  });
}

export function updateAdminHomePageSection(sectionId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/sections/${sectionId}`, {
    method: 'PUT',
    body: payload,
    ...options
  });
}

export function reorderAdminHomePageSection(sectionId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/sections/${sectionId}/reorder`, {
    method: 'PATCH',
    body: payload,
    ...options
  });
}

export function deleteAdminHomePageSection(sectionId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/sections/${sectionId}`, {
    method: 'DELETE',
    ...options
  });
}

export function duplicateAdminHomePageSection(sectionId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/sections/${sectionId}/duplicate`, {
    method: 'POST',
    ...options
  });
}

export function createAdminHomePageComponent(sectionId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/sections/${sectionId}/components`, {
    method: 'POST',
    body: payload,
    ...options
  });
}

export function updateAdminHomePageComponent(componentId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/components/${componentId}`, {
    method: 'PUT',
    body: payload,
    ...options
  });
}

export function reorderAdminHomePageComponent(componentId, payload, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/components/${componentId}/reorder`, {
    method: 'PATCH',
    body: payload,
    ...options
  });
}

export function deleteAdminHomePageComponent(componentId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/components/${componentId}`, {
    method: 'DELETE',
    ...options
  });
}

export function duplicateAdminHomePageComponent(componentId, options = {}) {
  return request(`${ADMIN_HOME_BUILDER_ROOT}/components/${componentId}/duplicate`, {
    method: 'POST',
    ...options
  });
}
