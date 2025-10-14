import mockDashboards from './mockDashboards.js';

const API_BASE = '/api/analytics/dashboards';
const TOKEN_STORAGE_KEY = 'fixnado:accessToken';

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

const readAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage?.getItem(TOKEN_STORAGE_KEY) ?? null;
  } catch (error) {
    console.warn('[analyticsDashboardClient] Unable to read auth token', error);
    return null;
  }
};

const createHeaders = (accept, persona) => {
  const headers = new Headers({ Accept: accept });
  if (persona) {
    headers.set('X-Fixnado-Persona', persona);
  }

  const token = readAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

const shouldUseFallback = () => {
  const { DEV = false, MODE } = import.meta.env ?? {};
  return Boolean(DEV) && MODE !== 'test';
};

export const buildExportUrl = (persona, params = {}) => `${API_BASE}/${persona}/export${toQueryString(params)}`;

export const fetchDashboard = async (persona, params = {}, options = {}) => {
  const { signal, headers: _headers, credentials: _credentials, ...restOptions } = options ?? {};
  try {
    const response = await fetch(`${API_BASE}/${persona}${toQueryString(params)}`, {
      headers: createHeaders('application/json', persona),
      credentials: 'include',
      signal,
      ...restOptions
    });

    if (!response.ok) {
      let body = {};
      try {
        body = await response.json();
      } catch (parseError) {
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
    if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
      throw error;
    }

    const fallback = mockDashboards?.[persona];
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
    } catch (parseError) {
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
