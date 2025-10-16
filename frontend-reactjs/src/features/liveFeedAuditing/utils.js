import { EVENT_TYPES, STATUS_OPTIONS } from './constants.js';

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export function formatEventType(type) {
  if (!type) return '—';
  const descriptor = EVENT_TYPES.find((option) => option.value === type);
  if (descriptor) {
    return descriptor.label;
  }
  const segments = type.split('.');
  return segments.slice(-2).join(' ').replace(/_/g, ' ');
}

export function toneForSeverity(severity) {
  switch (severity) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'accent';
    case 'low':
      return 'info';
    default:
      return 'neutral';
  }
}

export function statusLabel(status) {
  const descriptor = STATUS_OPTIONS.find((option) => option.value === status);
  return descriptor ? descriptor.label : status;
}

export function parseTags(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

export function formatTags(tags) {
  if (!Array.isArray(tags)) {
    return '';
  }
  return tags.join(', ');
}
