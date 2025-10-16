const BASE_URL = '/api/bookings';

const toQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.append(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : '';
};

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse JSON payload from order history client', error);
    return null;
  }
};

const handleResponse = async (response, fallbackMessage) => {
  if (response.ok) {
    return parseJson(response);
  }

  const payload = (await parseJson(response)) || {};
  const error = new Error(payload.message || fallbackMessage);
  error.status = response.status;
  error.payload = payload;
  throw error;
};

export const fetchOrders = async (params = {}) => {
  const response = await fetch(`${BASE_URL}${toQueryString(params)}`);
  const data = await handleResponse(response, 'Failed to load orders');
  return Array.isArray(data) ? data : [];
};

export const fetchOrder = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const response = await fetch(`${BASE_URL}/${orderId}`);
  return handleResponse(response, 'Failed to load order');
};

export const fetchOrderHistory = async (orderId, params = {}) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const response = await fetch(`${BASE_URL}/${orderId}/history${toQueryString(params)}`);
  const data = await handleResponse(response, 'Failed to load order history');
  return data || { total: 0, entries: [] };
};

export const createOrderHistoryEntry = async (orderId, payload = {}) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const response = await fetch(`${BASE_URL}/${orderId}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to create history entry');
};

export const updateOrderHistoryEntry = async (orderId, entryId, payload = {}) => {
  if (!orderId || !entryId) {
    throw new Error('orderId and entryId are required');
  }
  const response = await fetch(`${BASE_URL}/${orderId}/history/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response, 'Failed to update history entry');
};

export const deleteOrderHistoryEntry = async (orderId, entryId) => {
  if (!orderId || !entryId) {
    throw new Error('orderId and entryId are required');
  }
  const response = await fetch(`${BASE_URL}/${orderId}/history/${entryId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    await handleResponse(response, 'Failed to delete history entry');
  }
  return true;
};

export const updateOrderStatus = async (orderId, payload = {}) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }

  const response = await fetch(`${BASE_URL}/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return handleResponse(response, 'Failed to update order status');
};

export default {
  fetchOrders,
  fetchOrder,
  fetchOrderHistory,
  createOrderHistoryEntry,
  updateOrderHistoryEntry,
  deleteOrderHistoryEntry,
  updateOrderStatus
};
