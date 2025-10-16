const API_ROOT = '/api/services';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
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

export async function listServices(params = {}, options = {}) {
  const { signal, headers: extraHeaders, credentials = 'include' } = options;
  const headers = new Headers({ Accept: 'application/json' });
  if (extraHeaders) {
    for (const [key, value] of new Headers(extraHeaders).entries()) {
      headers.set(key, value);
    }
  }
  const response = await fetch(`${API_ROOT}${buildQuery(params)}`, {
    method: 'GET',
    headers,
    credentials,
    signal
  });
  return handleResponse(response, 'Unable to load services');
}

export default { listServices };
