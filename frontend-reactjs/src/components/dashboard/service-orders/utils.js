import { DEFAULT_FORM_STATE } from './constants.js';

export const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

export function generateLocalId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `att-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatCurrency(value, currency = 'GBP') {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
  } catch {
    return numberFormatter.format(value);
  }
}

export function formatDate(value) {
  if (!value) {
    return 'Not scheduled';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string' && value.length === 16 && value.includes('T')) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
}

export function normaliseTagsInput(input) {
  if (!input) {
    return [];
  }
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function buildTagsInput(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }
  return tags.join(', ');
}

export function toFormState(order = null) {
  if (!order) {
    return { ...DEFAULT_FORM_STATE };
  }
  return {
    title: order.title || '',
    serviceId: order.serviceId || '',
    status: order.status || 'draft',
    priority: order.priority || 'medium',
    totalAmount: order.totalAmount != null ? String(order.totalAmount) : '',
    currency: order.currency || 'GBP',
    scheduledFor: order.scheduledFor || '',
    summary: order.summary || '',
    siteAddress: order.metadata?.siteAddress || '',
    contactName: order.metadata?.contactName || '',
    contactPhone: order.metadata?.contactPhone || '',
    poNumber: order.metadata?.poNumber || '',
    approvalStatus: order.metadata?.approvalStatus || 'not_requested',
    tagsInput: buildTagsInput(order.tags),
    attachments: Array.isArray(order.attachments) ? order.attachments : []
  };
}
