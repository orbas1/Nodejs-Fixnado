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

export function buildExportUrl(persona, params = {}) {
  return `${API_BASE}/${persona}/export${toQueryString(params)}`;
}

export async function fetchDashboard(persona, params = {}) {
  const response = await fetch(`${API_BASE}/${persona}${toQueryString(params)}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.message || `Failed to load ${persona} dashboard`;
    throw new Error(message);
  }

  return response.json();
}

export async function downloadDashboardCsv(persona, params = {}) {
  const response = await fetch(`${API_BASE}/${persona}/export${toQueryString(params)}`, {
    headers: {
      Accept: 'text/csv'
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || 'Failed to download export');
  }

  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/i)?.[1] ?? `${persona}-analytics.csv`;
  return { blob, filename };
}
