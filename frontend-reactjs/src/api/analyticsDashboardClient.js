import mockDashboards from './mockDashboards.js';

const API_BASE = '/api/analytics/dashboards';

function toQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    searchParams.append(key, value);
  });
  const result = searchParams.toString();
  return result ? `?${result}` : '';
}

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage?.getItem('fixnado:accessToken') ?? null;
  } catch (error) {
    console.warn('[analyticsDashboardClient] unable to read auth token', error);
    return null;
  }
}

export function buildExportUrl(persona, params = {}) {
  return `${API_BASE}/${persona}/export${toQueryString(params)}`;
}

export async function fetchDashboard(persona, params = {}) {
  try {
    const headers = new Headers({ Accept: 'application/json' });
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}/${persona}${toQueryString(params)}`, {
      headers,
      credentials: 'include'
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
    const { DEV = false, MODE } = import.meta.env ?? {};
    const isDevEnvironment = Boolean(DEV);
    const isTestEnvironment = MODE === 'test';
    if (isDevEnvironment && !isTestEnvironment && fallback) {
    const mode = import.meta.env?.MODE ?? process.env?.NODE_ENV;
    const allowDevFallback = import.meta.env?.DEV && mode !== 'test';
    if (allowDevFallback && fallback) {
    const allowFallback = import.meta.env.DEV && import.meta.env.MODE !== 'test';
    if (allowFallback && fallback) {
      console.warn(`Falling back to mock ${persona} dashboard`, error);
      return fallback;
    }

    throw error;
  }
}

export async function downloadDashboardCsv(persona, params = {}) {
  const headers = new Headers({ Accept: 'text/csv' });
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}/${persona}/export${toQueryString(params)}`, {
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    let body = {};
    try {
      body = await response.json();
    } catch (parseError) {
      body = {};
    }
    const downloadError = new Error(body?.message || 'Failed to download export');
    downloadError.status = response.status;
    downloadError.code = body?.code ?? body?.message;
    throw downloadError;
  }

  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/i)?.[1] ?? `${persona}-analytics.csv`;
  return { blob, filename };
}
