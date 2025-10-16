import { CATEGORY_LABELS } from './constants.js';

export function formatTime(iso, timezone) {
  if (!iso) return '--:--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || undefined
  }).format(date);
}

export function formatDateTimeInputValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function normaliseManualEvent(event, timezone) {
  return {
    id: event.id,
    time: formatTime(event.occurredAt, timezone),
    event: event.title,
    owner: event.ownerName,
    ownerTeam: event.ownerTeam,
    status: event.status,
    category: event.category,
    summary: event.summary || '',
    attachments: Array.isArray(event.attachments) ? event.attachments : [],
    occurredAt: event.occurredAt,
    dueAt: event.dueAt || null,
    source: 'manual',
    metadata: event.metadata || {}
  };
}

export function aggregateByKey(events, key) {
  return events.reduce((acc, entry) => {
    const value = entry[key] || 'other';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function mergeCounts(baseCounts = {}, additionalCounts = {}) {
  return Object.entries(additionalCounts).reduce((acc, [key, value]) => {
    acc[key] = (acc[key] ?? 0) + value;
    return acc;
  }, { ...baseCounts });
}

export function emptyForm(timezone) {
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
  return {
    title: '',
    summary: '',
    category: 'compliance',
    status: 'scheduled',
    ownerName: '',
    ownerTeam: '',
    occurredAt: formatDateTimeInputValue(iso),
    dueAt: '',
    attachments: [{ label: '', url: '' }],
    note: '',
    timezone
  };
}

export function buildCategoryStats(counts = {}) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, label: CATEGORY_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildStatusStats(counts = {}, statusLabels) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count, label: statusLabels[key]?.label || key }))
    .sort((a, b) => b.count - a.count);
}

export function formatRange(range) {
  if (!range?.start || !range?.end) {
    return 'Current window';
  }
  const start = new Date(range.start);
  const end = new Date(range.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Current window';
  }
  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}

export function formatTimezone(timezone) {
  return timezone ? timezone.replace('_', ' ') : 'Europe/London';
}

export function formatLastUpdated(timestamp) {
  if (!timestamp) {
    return 'Not captured';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Not captured';
  }
  return date.toLocaleString();
}

function escapeCsvValue(value) {
  if (value == null) {
    return '';
  }
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function eventsToCsv(events = []) {
  const headers = [
    'Event',
    'Category',
    'Status',
    'Owner',
    'Owner team',
    'Occurred at',
    'Due at',
    'Source',
    'Summary',
    'Attachments'
  ];

  const rows = events.map((event) => {
    const attachments = Array.isArray(event.attachments)
      ? event.attachments
          .filter((attachment) => attachment?.url)
          .map((attachment) => `${attachment.label || 'Attachment'}: ${attachment.url}`)
          .join('; ')
      : '';

    return [
      event.event,
      event.category,
      event.status,
      event.owner,
      event.ownerTeam,
      event.occurredAt,
      event.dueAt,
      event.source,
      event.summary,
      attachments
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}
