import mockDashboards from './mockDashboards.js';

const API_BASE = '/api/analytics/dashboards';

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') {
      return;
    }
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
};

const createHeaders = (accept, persona) => {
  const headers = new Headers({ Accept: accept });
  if (persona) {
    headers.set('X-Fixnado-Persona', persona);
  }

  return headers;
};

const shouldUseFallback = () => {
  const { DEV = false, MODE } = import.meta.env ?? {};
  return Boolean(DEV) && MODE !== 'test';
};

export const buildExportUrl = (persona, params = {}) => `${API_BASE}/${persona}/export${toQueryString(params)}`;

export const fetchDashboard = async (persona, params = {}, options = {}) => {
  const { signal, headers: extraHeaders, credentials = 'include', ...restOptions } = options ?? {};
  try {
    const headers = createHeaders('application/json', persona);
    if (extraHeaders) {
      const iterable = extraHeaders instanceof Headers ? extraHeaders.entries() : Object.entries(extraHeaders);
      for (const [key, value] of iterable) {
        headers.set(key, value);
      }
    }

    const response = await fetch(`${API_BASE}/${persona}${toQueryString(params)}`, {
      headers,
      credentials,
      signal,
      ...restOptions
    });

    if (!response.ok) {
      let body = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }

      const error = new Error(body?.message || `Failed to load ${persona} dashboard`);
      error.status = response.status;
      error.code = body?.code ?? body?.message;

      if (response.status === 401) {
        error.message = 'Authentication required to view this dashboard';
      } else if (response.status === 403) {
        error.message = 'You do not have access to this dashboard yet';
      }

      throw error;
    }

    return response.json();
  } catch (error) {
    const fallback = mockDashboards?.[persona];

    if (error?.status === 401 || error?.status === 403) {
      throw error;
    }

    if (error?.status === 404 && fallback && shouldUseFallback()) {
      console.warn(`Falling back to mock ${persona} dashboard after 404`, error);
      return fallback;
    }

    if (fallback && shouldUseFallback()) {
      console.warn(`Falling back to mock ${persona} dashboard`, error);
      return fallback;
    }

    throw error;
  }
};

export const downloadDashboardCsv = async (persona, params = {}) => {
  const response = await fetch(`${API_BASE}/${persona}/export${toQueryString(params)}`, {
    headers: createHeaders('text/csv', persona),
    credentials: 'include'
  });

  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }

    const error = new Error(body?.message || `Failed to export ${persona} dashboard`);
    error.status = response.status;
    error.code = body?.code ?? body?.message;

    throw error;
  }

  return response.blob();
};

export default {
  buildExportUrl,
  fetchDashboard,
  downloadDashboardCsv
};
