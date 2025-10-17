import {
  PanelApiError,
  normaliseServicemanFinance,
  normaliseServicemanPayment,
  normaliseServicemanCommissionRule
} from './panelClient.js';

const API_ROOT = '/api';

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value].filter(Boolean);
}

async function requestJson(path, { method = 'GET', body, signal } = {}) {
  const headers = new Headers({ Accept: 'application/json' });
  let payload = body;

  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    body: payload,
    signal,
    credentials: 'include'
  });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch (error) {
      // ignore JSON parse errors
    }

    const message =
      errorBody?.message || errorBody?.error || response.statusText || 'Request failed';

    throw new PanelApiError(message, response.status, {
      code: errorBody?.code,
      details: errorBody?.errors || errorBody?.details,
      cause: errorBody
    });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '' || Number.isNaN(value)) {
      return;
    }
    searchParams.append(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getServicemanPaymentsWorkspace({
  companyId,
  limit,
  offset,
  status,
  query,
  signal
} = {}) {
  const search = buildQuery({ companyId, limit, offset, status, q: query });
  const payload = await requestJson(`/panel/provider/servicemen/payments${search}`, { signal });
  return normaliseServicemanFinance(payload?.data ?? payload ?? {});
}

export async function createServicemanPayment(payload, { companyId, signal } = {}) {
  const body = {
    ...(companyId ? { companyId } : {}),
    ...(payload || {})
  };
  const response = await requestJson('/panel/provider/servicemen/payments', {
    method: 'POST',
    body,
    signal
  });
  return normaliseServicemanPayment(response?.data ?? response ?? null);
}

export async function updateServicemanPayment(paymentId, payload, { companyId, signal } = {}) {
  if (!paymentId) {
    throw new PanelApiError('Payment identifier required', 400);
  }
  const body = {
    ...(companyId ? { companyId } : {}),
    ...(payload || {})
  };
  const response = await requestJson(`/panel/provider/servicemen/payments/${encodeURIComponent(paymentId)}`, {
    method: 'PUT',
    body,
    signal
  });
  return normaliseServicemanPayment(response?.data ?? response ?? null);
}

export async function deleteServicemanPayment(paymentId, { companyId, signal } = {}) {
  if (!paymentId) {
    throw new PanelApiError('Payment identifier required', 400);
  }
  const search = buildQuery({ companyId });
  await requestJson(`/panel/provider/servicemen/payments/${encodeURIComponent(paymentId)}${search}`, {
    method: 'DELETE',
    signal
  });
}

export async function listServicemanCommissionRules({ companyId, signal } = {}) {
  const search = buildQuery({ companyId });
  const payload = await requestJson(`/panel/provider/servicemen/commissions${search}`, { signal });
  const data = payload?.data ?? payload ?? {};
  const rules = ensureArray(data.rules).map((rule, index) => normaliseServicemanCommissionRule(rule, index));

  return {
    rules,
    activeRules: data.activeRules ?? rules.filter((rule) => rule.approvalStatus === 'approved').length,
    defaultRuleId: data.defaultRuleId ?? rules.find((rule) => rule.isDefault)?.id ?? null
  };
}

export async function createServicemanCommissionRule(payload, { companyId, signal } = {}) {
  const body = {
    ...(companyId ? { companyId } : {}),
    ...(payload || {})
  };
  const response = await requestJson('/panel/provider/servicemen/commissions', {
    method: 'POST',
    body,
    signal
  });
  return normaliseServicemanCommissionRule(response?.data ?? response ?? null);
}

export async function updateServicemanCommissionRule(ruleId, payload, { companyId, signal } = {}) {
  if (!ruleId) {
    throw new PanelApiError('Commission rule identifier required', 400);
  }
  const body = {
    ...(companyId ? { companyId } : {}),
    ...(payload || {})
  };
  const response = await requestJson(`/panel/provider/servicemen/commissions/${encodeURIComponent(ruleId)}`, {
    method: 'PUT',
    body,
    signal
  });
  return normaliseServicemanCommissionRule(response?.data ?? response ?? null);
}

export async function archiveServicemanCommissionRule(ruleId, { companyId, signal } = {}) {
  if (!ruleId) {
    throw new PanelApiError('Commission rule identifier required', 400);
  }
  const search = buildQuery({ companyId });
  await requestJson(`/panel/provider/servicemen/commissions/${encodeURIComponent(ruleId)}${search}`, {
    method: 'DELETE',
    signal
  });
}

