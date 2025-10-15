const BLOG_API_ROOT = '/api/blog';

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null) {
          const trimmed = `${entry}`.trim();
          if (trimmed) {
            search.append(key, trimmed);
          }
        }
      });
      return;
    }
    const trimmed = `${value}`.trim();
    if (trimmed) {
      search.append(key, trimmed);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, signal, authenticated = false } = {}) {
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
      controller.signal.addEventListener('abort', () => signal.removeEventListener('abort', abort), {
        once: true
      });
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
    const networkError = new Error('Unable to reach Fixnado blog services.');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (isJson) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[blogClient] failed to parse JSON response', error);
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

export async function fetchBlogPosts(params = {}, options = {}) {
  const query = buildQuery(params);
  const payload = await request(`${BLOG_API_ROOT}${query}`, options);
  if (Array.isArray(payload?.data)) {
    return payload;
  }
  return { data: [], pagination: { total: 0, page: 1, pageSize: params.pageSize ?? 12 } };
}

export async function fetchBlogPost(slug, options = {}) {
  if (!slug) {
    throw new Error('Blog slug is required');
  }
  const payload = await request(`${BLOG_API_ROOT}/${slug}`, options);
  return payload?.data ?? null;
}

export async function fetchDashboardBlogPosts({ limit } = {}, options = {}) {
  const query = buildQuery({ limit });
  const payload = await request(`${BLOG_API_ROOT}/dashboard${query}`, {
    ...options,
    authenticated: true
  });
  return Array.isArray(payload?.data) ? payload.data : [];
}
