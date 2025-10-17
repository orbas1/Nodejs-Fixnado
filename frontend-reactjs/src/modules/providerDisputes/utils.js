const STATUS_LABELS = Object.freeze({
  draft: 'Draft',
  open: 'Open',
  under_review: 'Review',
  awaiting_customer: 'Await',
  resolved: 'Resolved',
  closed: 'Closed'
});

const STATUS_TONES = Object.freeze({
  draft: 'neutral',
  open: 'warning',
  under_review: 'info',
  awaiting_customer: 'info',
  resolved: 'success',
  closed: 'success'
});

export const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Review' },
  { value: 'awaiting_customer', label: 'Await' },
  { value: 'resolved', label: 'Done' },
  { value: 'closed', label: 'Closed' }
];

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Review' },
  { value: 'awaiting_customer', label: 'Await' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

export const CATEGORY_OPTIONS = [
  { value: 'billing', label: 'Billing' },
  { value: 'service_quality', label: 'Quality' },
  { value: 'damage', label: 'Damage' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Other' }
];

export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

export const TASK_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Void' }
];

export const TASK_STATUS_LABELS = Object.freeze({
  pending: 'Pending',
  in_progress: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled'
});

export const TASK_STATUS_TONES = Object.freeze({
  pending: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'neutral'
});

export const NOTE_TYPE_OPTIONS = [
  { value: 'update', label: 'Update' },
  { value: 'call', label: 'Call' },
  { value: 'decision', label: 'Decision' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'other', label: 'Other' }
];

export const NOTE_VISIBILITY_OPTIONS = [
  { value: 'provider', label: 'Provider' },
  { value: 'customer', label: 'Customer' },
  { value: 'finance', label: 'Finance' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'internal', label: 'Internal' }
];

const DEFAULT_CURRENCY = 'GBP';

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || DEFAULT_CURRENCY,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => `${num}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function fromDateTimeInput(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || '—';
}

export function getStatusTone(status) {
  return STATUS_TONES[status] || 'neutral';
}

export function resolvePrimaryCurrency(cases) {
  if (!Array.isArray(cases)) {
    return DEFAULT_CURRENCY;
  }
  const currency = cases.find((entry) => entry?.currency)?.currency;
  return currency || DEFAULT_CURRENCY;
}

export const STATUS_SHORT_LABELS = Object.freeze({
  draft: 'Draft',
  open: 'Open',
  under_review: 'Review',
  awaiting_customer: 'Await',
  resolved: 'Done',
  closed: 'Closed'
});

export function normaliseAmountInput(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : '';
}

export function asNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const STATUS_KEYS = Object.keys(STATUS_LABELS);

export default {
  STATUS_FILTERS,
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  NOTE_TYPE_OPTIONS,
  NOTE_VISIBILITY_OPTIONS,
  formatCurrency,
  formatDate,
  formatDateTime,
  toDateTimeInput,
  fromDateTimeInput,
  getStatusLabel,
  getStatusTone,
  resolvePrimaryCurrency,
  normaliseAmountInput,
  asNumber,
  STATUS_SHORT_LABELS,
  STATUS_LABELS,
  STATUS_TONES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONES
};
