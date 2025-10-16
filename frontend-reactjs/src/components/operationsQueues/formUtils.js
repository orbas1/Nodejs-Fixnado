import { DEFAULT_METADATA } from './constants.js';

export function ensureList(values) {
  if (Array.isArray(values) && values.length > 0) {
    return values;
  }
  return [''];
}

export function normaliseList(values) {
  return ensureList(values).map((value) => (typeof value === 'string' ? value : '')).slice(0, 10);
}

export function defaultBoardForm() {
  return {
    title: '',
    owner: '',
    summary: '',
    status: 'operational',
    priority: 3,
    metadata: { ...DEFAULT_METADATA }
  };
}

export function mapBoardToForm(board) {
  if (!board) {
    return defaultBoardForm();
  }
  const metadata = board.metadata && typeof board.metadata === 'object' ? board.metadata : DEFAULT_METADATA;
  return {
    title: board.title ?? '',
    owner: board.owner ?? '',
    summary: board.summary ?? '',
    status: board.status ?? 'operational',
    priority: Number.isFinite(board.priority) ? board.priority : 3,
    metadata: {
      tags: normaliseList(metadata.tags ?? []),
      watchers: normaliseList(metadata.watchers ?? []),
      intakeChannels: normaliseList(metadata.intakeChannels ?? []),
      slaMinutes:
        metadata.slaMinutes === null || metadata.slaMinutes === undefined
          ? ''
          : String(metadata.slaMinutes),
      escalationContact: typeof metadata.escalationContact === 'string' ? metadata.escalationContact : '',
      playbookUrl: typeof metadata.playbookUrl === 'string' ? metadata.playbookUrl : '',
      autoAlerts:
        metadata.autoAlerts !== undefined ? Boolean(metadata.autoAlerts) : DEFAULT_METADATA.autoAlerts,
      notes: typeof metadata.notes === 'string' ? metadata.notes : ''
    }
  };
}

export function defaultUpdateForm() {
  return {
    id: null,
    headline: '',
    body: '',
    tone: 'info',
    recordedAt: new Date().toISOString(),
    attachments: []
  };
}

export function mapUpdateToForm(update) {
  if (!update) {
    return defaultUpdateForm();
  }
  return {
    id: update.id ?? null,
    headline: update.headline ?? '',
    body: update.body ?? '',
    tone: update.tone ?? 'info',
    recordedAt: update.recordedAt ?? new Date().toISOString(),
    attachments: Array.isArray(update.attachments)
      ? update.attachments.map((attachment) => ({
          label: attachment.label ?? '',
          url: attachment.url ?? '',
          type: attachment.type ?? 'link'
        }))
      : []
  };
}

export function formatTimestamp(iso) {
  if (!iso) return 'Not recorded';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Not recorded';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function toLocalDateInputValue(iso) {
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
