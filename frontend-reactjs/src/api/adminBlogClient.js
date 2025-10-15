const ADMIN_BLOG_ROOT = '/api/admin/blog';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({
    Accept: 'application/json'
  });

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
    const networkError = new Error('Unable to contact admin blog services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[adminBlogClient] failed to parse JSON response', error);
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

export async function listAdminBlogPosts(params = {}) {
  const query = buildQuery(params);
  return request(`${ADMIN_BLOG_ROOT}/posts${query}`);
}

export async function createAdminBlogPost(payload) {
  return request(`${ADMIN_BLOG_ROOT}/posts`, { method: 'POST', body: payload });
}

export async function updateAdminBlogPost(postId, payload) {
  return request(`${ADMIN_BLOG_ROOT}/posts/${postId}`, { method: 'PUT', body: payload });
}

export async function publishAdminBlogPost(postId, payload = {}) {
  return request(`${ADMIN_BLOG_ROOT}/posts/${postId}/publish`, { method: 'PATCH', body: payload });
}

export async function archiveAdminBlogPost(postId) {
  return request(`${ADMIN_BLOG_ROOT}/posts/${postId}/archive`, { method: 'PATCH' });
}

export async function deleteAdminBlogPost(postId) {
  return request(`${ADMIN_BLOG_ROOT}/posts/${postId}`, { method: 'DELETE' });
}

export async function listAdminBlogCategories() {
  return request(`${ADMIN_BLOG_ROOT}/categories`);
}

export async function upsertAdminBlogCategory(payload) {
  if (payload?.id) {
    return request(`${ADMIN_BLOG_ROOT}/categories/${payload.id}`, { method: 'PUT', body: payload });
  }
  return request(`${ADMIN_BLOG_ROOT}/categories`, { method: 'POST', body: payload });
}

export async function deleteAdminBlogCategory(categoryId) {
  return request(`${ADMIN_BLOG_ROOT}/categories/${categoryId}`, { method: 'DELETE' });
}

export async function listAdminBlogTags() {
  return request(`${ADMIN_BLOG_ROOT}/tags`);
}

export async function upsertAdminBlogTag(payload) {
  if (payload?.id) {
    return request(`${ADMIN_BLOG_ROOT}/tags/${payload.id}`, { method: 'PUT', body: payload });
  }
  return request(`${ADMIN_BLOG_ROOT}/tags`, { method: 'POST', body: payload });
}

export async function deleteAdminBlogTag(tagId) {
  return request(`${ADMIN_BLOG_ROOT}/tags/${tagId}`, { method: 'DELETE' });
}
