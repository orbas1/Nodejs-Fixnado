const BASE_ENDPOINT = '/api/admin/operations/queues';

function toError(message, response, payload) {
  const error = new Error(message);
  if (response) {
    error.status = response.status;
  }
  if (payload && typeof payload === 'object') {
    error.details = payload.details ?? payload.errors ?? payload;
  }
  return error;
}

async function parseResponse(response, fallbackMessage) {
  if (response.ok) {
    const payload = await response.json().catch(() => ({}));
    return payload;
  }
  const errorPayload = await response.json().catch(() => ({}));
  throw toError(errorPayload?.message || fallbackMessage, response, errorPayload);
}

function normaliseQueueAttachments(rawAttachments) {
  if (!Array.isArray(rawAttachments)) {
    return [];
  }
  return rawAttachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }
      const label = typeof attachment.label === 'string' && attachment.label.trim().length
        ? attachment.label.trim()
        : typeof attachment.title === 'string' && attachment.title.trim().length
          ? attachment.title.trim()
          : null;
      const url = typeof attachment.url === 'string' && attachment.url.trim().length
        ? attachment.url.trim()
        : typeof attachment.href === 'string' && attachment.href.trim().length
          ? attachment.href.trim()
          : null;
      if (!url) {
        return null;
      }
      const type = typeof attachment.type === 'string' && attachment.type.trim().length
        ? attachment.type.trim()
        : 'link';
      return { label: label || url, url, type };
    })
    .filter(Boolean);
}

function normaliseQueueUpdate(update, boardId, index) {
  if (!update || typeof update !== 'object') {
    const fallbackHeadline = typeof update === 'string' && update.trim().length ? update.trim() : `Update ${index + 1}`;
    return {
      id: `${boardId}-update-${index}`,
      headline: fallbackHeadline,
      body: '',
      tone: 'info',
      recordedAt: null,
      attachments: []
    };
  }

  const headline =
    (typeof update.headline === 'string' && update.headline.trim().length && update.headline.trim()) ||
    (typeof update.title === 'string' && update.title.trim().length && update.title.trim()) ||
    `Update ${index + 1}`;
  const body =
    (typeof update.body === 'string' && update.body.trim()) ||
    (typeof update.description === 'string' && update.description.trim()) ||
    '';
  const tone = typeof update.tone === 'string' && update.tone.trim().length ? update.tone.trim() : 'info';
  const recordedAt =
    (typeof update.recordedAt === 'string' && update.recordedAt) ||
    (typeof update.timestamp === 'string' && update.timestamp) ||
    null;

  return {
    id: update.id || `${boardId}-update-${index}`,
    headline,
    body,
    tone,
    recordedAt,
    attachments: normaliseQueueAttachments(update.attachments)
  };
}

function normaliseBoard(board, index = 0) {
  if (!board || typeof board !== 'object') {
    return {
      id: `board-${index}`,
      slug: null,
      title: `Queue ${index + 1}`,
      summary: '',
      owner: 'Operations',
      status: 'operational',
      priority: index + 1,
      metadata: {},
      createdAt: null,
      updatedAt: null,
      updates: []
    };
  }

  const id = board.id || `board-${index}`;
  const priority = Number.parseInt(board.priority ?? index + 1, 10);

  return {
    id,
    slug: board.slug || null,
    title: board.title || board.name || `Queue ${index + 1}`,
    summary: typeof board.summary === 'string' ? board.summary : '',
    owner: board.owner || 'Operations',
    status: board.status || 'operational',
    priority: Number.isFinite(priority) ? priority : index + 1,
      metadata: normaliseBoardMetadata(board.metadata),
      createdAt: board.createdAt || null,
      updatedAt: board.updatedAt || null,
      updates: Array.isArray(board.updates)
        ? board.updates.map((update, updateIndex) => normaliseQueueUpdate(update, id, updateIndex))
        : []
  };
}

function normaliseCapabilities(capabilities = {}) {
  return {
    canCreate: Boolean(capabilities.canCreate),
    canEdit: Boolean(capabilities.canEdit ?? capabilities.canUpdate ?? capabilities.canManage),
    canArchive: Boolean(capabilities.canArchive ?? capabilities.canEdit ?? capabilities.canManage),
    canManageUpdates: Boolean(capabilities.canManageUpdates ?? capabilities.canEdit ?? capabilities.canManage)
  };
}

function normaliseCollection(payload = {}) {
  const boards = Array.isArray(payload.boards)
    ? payload.boards.map((board, index) => normaliseBoard(board, index))
    : [];
  return {
    boards,
    capabilities: normaliseCapabilities(payload.capabilities)
  };
}

export async function fetchOperationsQueues({ signal } = {}) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await parseResponse(response, 'Failed to load operations queues');
  return normaliseCollection(payload);
}

export async function createOperationsQueue(body) {
  const response = await fetch(BASE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to create operations queue');
  return normaliseBoard(payload.board || payload, 0);
}

export async function updateOperationsQueue(id, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to update operations queue');
  return normaliseBoard(payload.board || payload, 0);
}

export async function archiveOperationsQueue(id) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  const payload = await parseResponse(response, 'Failed to archive operations queue');
  return normaliseBoard(payload.board || payload, 0);
}

export async function createOperationsQueueUpdate(boardId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(boardId)}/updates`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to create queue update');
  return normaliseQueueUpdate(payload.update || payload, boardId, 0);
}

export async function updateOperationsQueueUpdate(boardId, updateId, body) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(boardId)}/updates/${encodeURIComponent(updateId)}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await parseResponse(response, 'Failed to update queue update');
  return normaliseQueueUpdate(payload.update || payload, boardId, 0);
}

export async function deleteOperationsQueueUpdate(boardId, updateId) {
  const response = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(boardId)}/updates/${encodeURIComponent(updateId)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });

  if (!response.ok && response.status !== 204) {
    const payload = await response.json().catch(() => ({}));
    throw toError(payload?.message || 'Failed to delete queue update', response, payload);
  }
}

export function normaliseOperationsQueues(payload) {
  return normaliseCollection(payload);
}

export default {
  fetchOperationsQueues,
  createOperationsQueue,
  updateOperationsQueue,
  archiveOperationsQueue,
  createOperationsQueueUpdate,
  updateOperationsQueueUpdate,
  deleteOperationsQueueUpdate,
  prepareQueueMetadataForSubmit
};
const DEFAULT_METADATA = Object.freeze({
  tags: [],
  watchers: [],
  intakeChannels: [],
  slaMinutes: null,
  escalationContact: '',
  playbookUrl: '',
  autoAlerts: true,
  notes: ''
});

function normaliseMetadataArray(values, { max = 10 } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(trimmed.slice(0, 140));
  });

  if (result.length > max) {
    return result.slice(0, max);
  }

  return result;
}

function normaliseBoardMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { ...DEFAULT_METADATA };
  }

  const tags = normaliseMetadataArray(metadata.tags, { max: 12 });
  const watchers = normaliseMetadataArray(metadata.watchers, { max: 10 });
  const intakeChannels = normaliseMetadataArray(metadata.intakeChannels, { max: 10 });
  const rawSla = Number.parseInt(metadata.slaMinutes ?? metadata.sla ?? metadata.slaTarget, 10);
  const slaMinutes = Number.isFinite(rawSla) ? Math.min(Math.max(rawSla, 0), 2880) : null;

  return {
    tags,
    watchers,
    intakeChannels,
    slaMinutes,
    escalationContact:
      typeof metadata.escalationContact === 'string'
        ? metadata.escalationContact.trim().slice(0, 160)
        : '',
    playbookUrl:
      typeof metadata.playbookUrl === 'string' ? metadata.playbookUrl.trim().slice(0, 512) : '',
    autoAlerts:
      metadata.autoAlerts !== undefined ? Boolean(metadata.autoAlerts) : DEFAULT_METADATA.autoAlerts,
    notes: typeof metadata.notes === 'string' ? metadata.notes.trim().slice(0, 1200) : ''
  };
}

export function prepareQueueMetadataForSubmit(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { ...DEFAULT_METADATA };
  }

  const normaliseArray = (values, max) =>
    normaliseMetadataArray(values, { max }).map((value) => value.trim());

  const sla = Number.parseInt(metadata.slaMinutes ?? metadata.sla ?? '', 10);

  return {
    tags: normaliseArray(metadata.tags, 12),
    watchers: normaliseArray(metadata.watchers, 10),
    intakeChannels: normaliseArray(metadata.intakeChannels, 10),
    slaMinutes: Number.isFinite(sla) ? Math.min(Math.max(sla, 0), 2880) : null,
    escalationContact:
      typeof metadata.escalationContact === 'string'
        ? metadata.escalationContact.trim().slice(0, 160)
        : '',
    playbookUrl:
      typeof metadata.playbookUrl === 'string' ? metadata.playbookUrl.trim().slice(0, 512) : '',
    autoAlerts:
      metadata.autoAlerts !== undefined ? Boolean(metadata.autoAlerts) : DEFAULT_METADATA.autoAlerts,
    notes: typeof metadata.notes === 'string' ? metadata.notes.trim().slice(0, 1200) : ''
  };
}
