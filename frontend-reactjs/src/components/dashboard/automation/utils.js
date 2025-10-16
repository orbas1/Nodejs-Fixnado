export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function toCurrency(value, currency = 'GBP') {
  if (value == null || value === '') {
    return '—';
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(numeric);
  } catch (error) {
    return `${numeric.toFixed(0)} ${currency}`;
  }
}

export function normaliseSelectValue(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value ?? '';
}

export function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value].filter(Boolean);
}

export function toneForRisk(risk) {
  if (risk === 'low') return 'success';
  if (risk === 'medium') return 'info';
  return 'warning';
}

export function extractFieldErrors(details) {
  if (!details?.fieldErrors) {
    return {};
  }
  return Object.entries(details.fieldErrors).reduce((acc, [field, messages]) => {
    if (Array.isArray(messages) && messages.length > 0) {
      acc[field] = messages[0];
    }
    return acc;
  }, {});
}
