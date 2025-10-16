const ROOT = '/api/admin/purchases';

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
    const networkError = new Error('Unable to contact purchase management services');
    networkError.cause = error;
    throw networkError;
  }

  let payload = null;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      console.warn('[purchaseManagementClient] failed to parse JSON response', error);
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

export async function listPurchaseOrders(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/orders${query}`, options);
}

export async function getPurchaseOrder(orderId, options = {}) {
  return request(`${ROOT}/orders/${orderId}`, options);
}

export async function createPurchaseOrder(payload, options = {}) {
  return request(`${ROOT}/orders`, { method: 'POST', body: payload, ...options });
}

export async function updatePurchaseOrder(orderId, payload, options = {}) {
  return request(`${ROOT}/orders/${orderId}`, { method: 'PUT', body: payload, ...options });
}

export async function updatePurchaseOrderStatus(orderId, payload, options = {}) {
  return request(`${ROOT}/orders/${orderId}/status`, { method: 'PATCH', body: payload, ...options });
}

export async function recordPurchaseReceipt(orderId, payload, options = {}) {
  return request(`${ROOT}/orders/${orderId}/receipts`, { method: 'POST', body: payload, ...options });
}

export async function addPurchaseOrderAttachment(orderId, payload, options = {}) {
  return request(`${ROOT}/orders/${orderId}/attachments`, { method: 'POST', body: payload, ...options });
}

export async function deletePurchaseOrderAttachment(orderId, attachmentId, options = {}) {
  return request(`${ROOT}/orders/${orderId}/attachments/${attachmentId}`, { method: 'DELETE', ...options });
}

export async function listSuppliers(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/suppliers${query}`, options);
}

export async function upsertSupplier(payload, options = {}) {
  if (payload?.id) {
    return request(`${ROOT}/suppliers/${payload.id}`, { method: 'PUT', body: payload, ...options });
  }
  return request(`${ROOT}/suppliers`, { method: 'POST', body: payload, ...options });
}

export async function updateSupplierStatus(supplierId, payload, options = {}) {
  return request(`${ROOT}/suppliers/${supplierId}/status`, { method: 'PATCH', body: payload, ...options });
}

export async function listBudgets(params = {}, options = {}) {
  const query = buildQuery(params);
  return request(`${ROOT}/budgets${query}`, options);
}

export async function upsertBudget(payload, options = {}) {
  if (payload?.id) {
    return request(`${ROOT}/budgets/${payload.id}`, { method: 'PUT', body: payload, ...options });
  }
  return request(`${ROOT}/budgets`, { method: 'POST', body: payload, ...options });
}

export default {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  recordPurchaseReceipt,
  addPurchaseOrderAttachment,
  deletePurchaseOrderAttachment,
  listSuppliers,
  upsertSupplier,
  updateSupplierStatus,
  listBudgets,
  upsertBudget
};
