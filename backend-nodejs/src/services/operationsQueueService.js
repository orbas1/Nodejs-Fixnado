import { randomUUID } from 'node:crypto';
import slugify from 'slugify';
import OperationsQueueBoard from '../models/operationsQueueBoard.js';
import OperationsQueueUpdate from '../models/operationsQueueUpdate.js';

const SLUG_OPTIONS = { lower: true, strict: true, trim: true }; // ensure clean URL safe slug
const BOARD_STATUSES = new Set(['operational', 'attention', 'delayed', 'blocked']);
const UPDATE_TONES = new Set(['info', 'success', 'warning', 'danger']);
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

function normaliseMetadataArray(values, { max = 10, transform = (value) => value, unique = true } = {}) {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  for (const rawValue of values) {
    if (typeof rawValue !== 'string') {
      continue;
    }

    const transformed = transform(rawValue.trim());
    if (!transformed) {
      continue;
    }

    const key = unique ? transformed.toLowerCase() : `${result.length}-${transformed}`;
    if (unique && seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(transformed.slice(0, 140));

    if (result.length >= max) {
      break;
    }
  }

  return result;
}

function normaliseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return { ...DEFAULT_METADATA };
  }

  const tags = normaliseMetadataArray(metadata.tags, { max: 12 });
  const watchers = normaliseMetadataArray(metadata.watchers, { max: 10 });
  const intakeChannels = normaliseMetadataArray(metadata.intakeChannels, { max: 10 });

  const rawSla = Number.parseInt(metadata.slaMinutes ?? metadata.sla ?? metadata.slaTarget, 10);
  const slaMinutes = Number.isFinite(rawSla) ? Math.min(Math.max(rawSla, 0), 2880) : null;

  const escalationContact = normaliseString(metadata.escalationContact ?? metadata.escalation);
  const playbookUrl = normaliseString(metadata.playbookUrl ?? metadata.playbook);
  const notes = normaliseString(metadata.notes ?? metadata.description ?? '');
  const autoAlerts = Boolean(metadata.autoAlerts ?? metadata.autoAlert ?? DEFAULT_METADATA.autoAlerts);

  return {
    tags,
    watchers,
    intakeChannels,
    slaMinutes,
    escalationContact: escalationContact.slice(0, 160),
    playbookUrl: playbookUrl.slice(0, 512),
    autoAlerts,
    notes: notes.slice(0, 1200)
  };
}

function mergeMetadata(existing, updates) {
  const base = normaliseMetadata(existing);
  if (!updates || typeof updates !== 'object') {
    return base;
  }

  const next = normaliseMetadata({ ...base, ...updates });
  return next;
}

function normaliseString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function clampPriority(priority) {
  const parsed = Number.parseInt(priority, 10);
  if (!Number.isFinite(parsed)) {
    return 3;
  }
  return Math.min(5, Math.max(1, parsed));
}

function normaliseAttachments(raw = []) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const label = normaliseString(entry.label);
      const url = normaliseString(entry.url);
      if (!url) {
        return null;
      }
      const type = normaliseString(entry.type) || 'link';
      return { label: label || url, url, type };
    })
    .filter(Boolean);
}

function serialiseAttachments(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return normaliseAttachments(entries).map((entry) => ({
    label: entry.label,
    url: entry.url,
    type: entry.type
  }));
}

function buildSlug(input) {
  const base = normaliseString(input);
  const fallback = base ? slugify(base, SLUG_OPTIONS) : '';
  if (fallback) {
    return fallback.slice(0, 72);
  }
  return `queue-${randomUUID()}`;
}

function normaliseBoard(instance, includeUpdates = true) {
  if (!instance) {
    return null;
  }

  const plain = instance.toJSON();
  const updates = includeUpdates ? (plain.updates ?? []) : [];

  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    summary: plain.summary,
    owner: plain.owner,
    status: plain.status,
    priority: plain.priority,
    metadata: normaliseMetadata(plain.metadata),
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    archivedAt: plain.archivedAt ? new Date(plain.archivedAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    updates: includeUpdates
      ? updates.map((update) => ({
          id: update.id,
          headline: update.headline,
          body: update.body ?? '',
          tone: update.tone,
          recordedAt: update.recordedAt ? new Date(update.recordedAt).toISOString() : null,
          attachments: normaliseAttachments(update.attachments),
          createdBy: update.createdBy ?? null,
          updatedBy: update.updatedBy ?? null,
          position: update.position ?? 0
        }))
      : []
  };
}

export async function ensureUniqueSlug(candidate) {
  const base = buildSlug(candidate);
  let slug = base;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // use all scope to include archived records when checking uniqueness
    const existing = await OperationsQueueBoard.scope('all').findOne({ where: { slug } });
    if (!existing) {
      return slug;
    }
    attempt += 1;
    slug = `${base}-${attempt}`.slice(0, 72);
  }
}

export async function listQueueBoards({ includeUpdates = true, limit = 12 } = {}) {
  const resolvedLimit = Math.max(1, Math.min(limit ?? 12, 24));
  const boards = await OperationsQueueBoard.findAll({
    where: { isArchived: false },
    order: [
      ['priority', 'ASC'],
      ['updatedAt', 'DESC'],
      ['title', 'ASC']
    ],
    limit: resolvedLimit,
    include: includeUpdates
      ? [
          {
            model: OperationsQueueUpdate,
            as: 'updates',
            where: { isDeleted: false },
            required: false,
            separate: true,
            order: [
              ['recordedAt', 'DESC'],
              ['createdAt', 'DESC']
            ]
          }
        ]
      : []
  });

  return boards.map((board) => normaliseBoard(board, includeUpdates));
}

export async function getQueueBoard(id, { includeUpdates = true } = {}) {
  const board = await OperationsQueueBoard.scope('all').findByPk(id, {
    include: includeUpdates
      ? [
          {
            model: OperationsQueueUpdate,
            as: 'updates',
            where: { isDeleted: false },
            required: false,
            separate: true,
            order: [
              ['recordedAt', 'DESC'],
              ['createdAt', 'DESC']
            ]
          }
        ]
      : []
  });

  if (!board) {
    return null;
  }

  return normaliseBoard(board, includeUpdates);
}

export async function createQueueBoard(payload, { actor } = {}) {
  const title = normaliseString(payload?.title);
  const summary = normaliseString(payload?.summary);
  const owner = normaliseString(payload?.owner);
  if (!title || !summary || !owner) {
    throw new Error('Title, summary, and owner are required to create an operations queue');
  }

  const status = BOARD_STATUSES.has(normaliseString(payload?.status))
    ? normaliseString(payload.status)
    : 'operational';
  const priority = clampPriority(payload?.priority);
  const metadata = normaliseMetadata(payload?.metadata);
  const slug = await ensureUniqueSlug(payload?.slug || title);
  const actorId = actor?.actorId ?? actor?.userId ?? null;

  const record = await OperationsQueueBoard.create({
    slug,
    title,
    summary,
    owner,
    status,
    priority,
    metadata,
    createdBy: actorId,
    updatedBy: actorId
  });

  return normaliseBoard(record, false);
}

export async function updateQueueBoard(id, payload, { actor } = {}) {
  const board = await OperationsQueueBoard.scope('all').findByPk(id);
  if (!board) {
    throw new Error('Queue board not found');
  }

  const nextTitle = normaliseString(payload?.title);
  if (nextTitle) {
    board.title = nextTitle;
  }

  const nextSummary = normaliseString(payload?.summary);
  if (nextSummary) {
    board.summary = nextSummary;
  }

  const nextOwner = normaliseString(payload?.owner);
  if (nextOwner) {
    board.owner = nextOwner;
  }

  if (payload?.status && BOARD_STATUSES.has(normaliseString(payload.status))) {
    board.status = normaliseString(payload.status);
  }

  if (payload?.priority != null) {
    board.priority = clampPriority(payload.priority);
  }

  if (payload?.metadata && typeof payload.metadata === 'object' && payload.metadata !== null) {
    board.metadata = mergeMetadata(board.metadata, payload.metadata);
  }

  if (payload?.slug) {
    const desiredSlug = normaliseString(payload.slug);
    if (desiredSlug && desiredSlug !== board.slug) {
      board.slug = await ensureUniqueSlug(desiredSlug);
    }
  }

  board.updatedBy = actor?.actorId ?? actor?.userId ?? null;

  await board.save();

  return normaliseBoard(board, false);
}

export async function archiveQueueBoard(id, { actor } = {}) {
  const board = await OperationsQueueBoard.scope('all').findByPk(id);
  if (!board) {
    throw new Error('Queue board not found');
  }

  board.isArchived = true;
  board.archivedAt = new Date();
  board.updatedBy = actor?.actorId ?? actor?.userId ?? null;
  await board.save();

  return normaliseBoard(board, false);
}

async function resolvePosition(boardId) {
  const maxPosition = await OperationsQueueUpdate.max('position', {
    where: { boardId }
  });
  if (!Number.isFinite(maxPosition)) {
    return 1;
  }
  return maxPosition + 1;
}

export async function createQueueUpdate(boardId, payload, { actor } = {}) {
  const board = await OperationsQueueBoard.scope('all').findByPk(boardId);
  if (!board || board.isArchived) {
    throw new Error('Queue board not found or archived');
  }

  const headline = normaliseString(payload?.headline);
  if (!headline) {
    throw new Error('Headline is required for queue updates');
  }

  const body = normaliseString(payload?.body);
  const tone = UPDATE_TONES.has(normaliseString(payload?.tone))
    ? normaliseString(payload.tone)
    : 'info';
  const recordedAt = payload?.recordedAt ? new Date(payload.recordedAt) : new Date();
  const attachments = serialiseAttachments(payload?.attachments);
  const actorId = actor?.actorId ?? actor?.userId ?? null;
  const position = await resolvePosition(boardId);

  const update = await OperationsQueueUpdate.create({
    boardId,
    headline,
    body,
    tone,
    recordedAt,
    attachments,
    createdBy: actorId,
    updatedBy: actorId,
    position
  });

  return {
    id: update.id,
    headline: update.headline,
    body: update.body ?? '',
    tone: update.tone,
    recordedAt: update.recordedAt ? update.recordedAt.toISOString() : null,
    attachments: normaliseAttachments(update.attachments),
    createdBy: update.createdBy ?? null,
    updatedBy: update.updatedBy ?? null,
    position: update.position
  };
}

export async function updateQueueUpdate(boardId, updateId, payload, { actor } = {}) {
  const update = await OperationsQueueUpdate.findOne({
    where: {
      id: updateId,
      boardId
    }
  });

  if (!update) {
    throw new Error('Queue update not found');
  }

  const nextHeadline = normaliseString(payload?.headline);
  if (nextHeadline) {
    update.headline = nextHeadline;
  }

  if (payload?.body !== undefined) {
    update.body = normaliseString(payload.body);
  }

  if (payload?.tone && UPDATE_TONES.has(normaliseString(payload.tone))) {
    update.tone = normaliseString(payload.tone);
  }

  if (payload?.recordedAt) {
    const parsed = new Date(payload.recordedAt);
    if (!Number.isNaN(parsed.getTime())) {
      update.recordedAt = parsed;
    }
  }

  if (payload?.attachments) {
    update.attachments = serialiseAttachments(payload.attachments);
  }

  if (payload?.position != null && Number.isFinite(Number.parseInt(payload.position, 10))) {
    update.position = Number.parseInt(payload.position, 10);
  }

  update.updatedBy = actor?.actorId ?? actor?.userId ?? null;
  await update.save();

  return {
    id: update.id,
    headline: update.headline,
    body: update.body ?? '',
    tone: update.tone,
    recordedAt: update.recordedAt ? update.recordedAt.toISOString() : null,
    attachments: normaliseAttachments(update.attachments),
    createdBy: update.createdBy ?? null,
    updatedBy: update.updatedBy ?? null,
    position: update.position
  };
}

export async function deleteQueueUpdate(boardId, updateId, { actor } = {}) {
  const update = await OperationsQueueUpdate.findOne({
    where: {
      id: updateId,
      boardId,
      isDeleted: false
    }
  });

  if (!update) {
    throw new Error('Queue update not found');
  }

  update.isDeleted = true;
  update.updatedBy = actor?.actorId ?? actor?.userId ?? null;
  await update.save();

  return {
    id: update.id,
    deleted: true
  };
}

export async function reorderUpdates(boardId) {
  const updates = await OperationsQueueUpdate.findAll({
    where: { boardId },
    order: [
      ['recordedAt', 'DESC'],
      ['createdAt', 'DESC']
    ]
  });

  await Promise.all(
    updates.map((update, index) => {
      update.position = index + 1;
      return update.save();
    })
  );

  return updates.map((update) => ({
    id: update.id,
    position: update.position
  }));
}

export default {
  listQueueBoards,
  getQueueBoard,
  createQueueBoard,
  updateQueueBoard,
  archiveQueueBoard,
  createQueueUpdate,
  updateQueueUpdate,
  deleteQueueUpdate,
  reorderUpdates
};
