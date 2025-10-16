import { PanelApiError } from './panelClient.js';

export async function fetchServiceCatalogue({ companyId, limit = 100, signal } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (companyId) {
    params.set('companyId', companyId);
  }
  const response = await fetch(`/api/services?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new PanelApiError('Unable to load service catalogue', response.status);
  }
  return response.json();
}
